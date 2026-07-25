import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType, TabStopType, ExternalHyperlink, UnderlineType } from 'docx';

export interface StructuredResume {
  fullName: string;
  title?: string;
  contactLine?: {
    email: string;
    phone?: string;
    location?: string;
    links?: { label: string; url: string }[];
  } | string; // accept both old string and new object shape gracefully
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    dates: string;
    location?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    dates: string;
  }[];
  projects?: {
    name: string;
    bullets: string[];
  }[];
  certifications?: string[];
}

export interface DocxGenerationResult {
  success: boolean;
  data?: Buffer;
  error?: string;
}

export async function generateResumeDocx(resume: StructuredResume): Promise<DocxGenerationResult> {
  try {
    const children: Paragraph[] = [];
    const PAGE_WIDTH_TWIPS_0_5_MARGINS = 10800; // 8.5in total - 1in (2 * 0.5in margins) = 7.5in = 10800 twips

    // Header section
    children.push(
      new Paragraph({
        text: resume.fullName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );

    if (resume.title) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resume.title,
              font: "Calibri",
              size: 22, // 11pt
              color: "555555",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 20 },
        })
      );
    }

    if (resume.contactLine) {
      if (typeof resume.contactLine === 'string') {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: resume.contactLine,
                font: "Calibri",
                size: 18, // 9pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
          })
        );
      } else {
        const cl = resume.contactLine;
        const contactChildren: (TextRun | ExternalHyperlink)[] = [];
        const pushSeparator = () => {
          if (contactChildren.length > 0) {
            contactChildren.push(new TextRun({ text: "  |  ", font: "Calibri", size: 18 }));
          }
        };

        if (cl.email) {
          pushSeparator();
          contactChildren.push(
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: cl.email,
                  font: "Calibri",
                  size: 18,
                  color: "0563C1",
                  underline: { type: UnderlineType.SINGLE, color: "0563C1" },
                }),
              ],
              link: `mailto:${cl.email}`,
            })
          );
        }
        if (cl.phone) {
          pushSeparator();
          contactChildren.push(new TextRun({ text: cl.phone, font: "Calibri", size: 18 }));
        }
        if (cl.location) {
          pushSeparator();
          contactChildren.push(new TextRun({ text: cl.location, font: "Calibri", size: 18 }));
        }
        if (cl.links && cl.links.length > 0) {
          for (const link of cl.links) {
            pushSeparator();
            if (link.url) {
              contactChildren.push(
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: link.label,
                      font: "Calibri",
                      size: 18,
                      color: "0563C1",
                      underline: { type: UnderlineType.SINGLE, color: "0563C1" },
                    }),
                  ],
                  link: link.url,
                })
              );
            } else {
              contactChildren.push(new TextRun({ text: link.label, font: "Calibri", size: 18 }));
            }
          }
        }

        children.push(
          new Paragraph({
            children: contactChildren,
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
          })
        );
      }
    }

    // Divider
    children.push(
      new Paragraph({
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 60 },
      })
    );

    // Section head helper
    const addSectionHeading = (title: string) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              font: "Calibri",
              size: 22, // 11pt
              bold: true,
            }),
          ],
          spacing: { before: 160, after: 60 }, // Tight grouping
        })
      );
    };

    // PROFESSIONAL SUMMARY
    if (resume.summary) {
      addSectionHeading("PROFESSIONAL SUMMARY");
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resume.summary,
              font: "Calibri",
              size: 19, // 9.5pt
            }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    // TECHNICAL SKILLS
    if (resume.skills && resume.skills.length > 0) {
      addSectionHeading("TECHNICAL SKILLS");
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resume.skills.join(", "),
              font: "Calibri",
              size: 19, // 9.5pt
            }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    // PROFESSIONAL EXPERIENCE
    if (resume.experience && resume.experience.length > 0) {
      addSectionHeading("PROFESSIONAL EXPERIENCE");
      for (const exp of resume.experience) {
        children.push(
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: PAGE_WIDTH_TWIPS_0_5_MARGINS, 
              },
            ],
            children: [
              new TextRun({
                text: `${exp.role} - ${exp.company}`,
                font: "Calibri",
                size: 19,
                bold: true,
              }),
              new TextRun({
                text: `\t${exp.dates}`,
                font: "Calibri",
                size: 19,
                bold: true,
              }),
            ],
            spacing: { before: 60, after: exp.location ? 0 : 20 },
          })
        );

        if (exp.location) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.location,
                  font: "Calibri",
                  size: 19, // 9.5pt
                  italics: true,
                }),
              ],
              spacing: { after: 20 },
            })
          );
        }

        if (exp.bullets && exp.bullets.length > 0) {
          for (const bullet of exp.bullets) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: bullet,
                    font: "Calibri",
                    size: 19, // 9.5pt
                  }),
                ],
                bullet: { level: 0 },
                spacing: { after: 40 },
              })
            );
          }
        }
      }
    }

    // EDUCATION
    if (resume.education && resume.education.length > 0) {
      addSectionHeading("EDUCATION");
      for (const edu of resume.education) {
        children.push(
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: PAGE_WIDTH_TWIPS_0_5_MARGINS, 
              },
            ],
            children: [
              new TextRun({
                text: `${edu.degree} - ${edu.school}`,
                font: "Calibri",
                size: 19,
                bold: true,
              }),
              new TextRun({
                text: `\t${edu.dates}`,
                font: "Calibri",
                size: 19,
                bold: true,
              }),
            ],
            spacing: { before: 60, after: 40 },
          })
        );
      }
    }

    // PROJECTS
    if (resume.projects && resume.projects.length > 0) {
      addSectionHeading("PROJECTS");
      for (const proj of resume.projects) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: proj.name,
                font: "Calibri",
                size: 19,
                bold: true,
              }),
            ],
            spacing: { before: 60, after: 20 },
          })
        );

        if (proj.bullets && proj.bullets.length > 0) {
          for (const bullet of proj.bullets) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: bullet,
                    font: "Calibri",
                    size: 19,
                  }),
                ],
                bullet: { level: 0 },
                spacing: { after: 40 },
              })
            );
          }
        }
      }
    }

    // CERTIFICATIONS
    if (resume.certifications && resume.certifications.length > 0) {
      addSectionHeading("CERTIFICATIONS");
      for (const cert of resume.certifications) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cert,
                font: "Calibri",
                size: 19,
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }

    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 44, // 22pt
              bold: true,
              font: "Calibri",
            },
            paragraph: {
              spacing: { after: 60 },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inches
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return { success: true, data: buffer };
  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    return { success: false, error: 'Could not generate document' };
  }
}
