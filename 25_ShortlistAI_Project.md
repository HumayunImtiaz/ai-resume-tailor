# ShortlistAI - Project Deep Dive (Introduction & Architecture)

## 📌 Project Intro (Ye Project Kya Hai?)
**ShortlistAI** (pehle *AI Resume Tailor* ke naam se tha) ek intelligent, full-stack SaaS application hai. Iska main maqsad ye hai ke candidates apne purane (base) resume aur cover letter ko upload kar sakein, aur phir kisi bhi specific job description ko daal kar AI ke zariye ek naya ATS-friendly resume generate kar sakein. AI na sirf aapki skills aur experience ko analyze karta hai, balki purane resume me jo keywords miss hote hain unko beautifully natural language me naye resume me daal deta hai, taake ATS (Applicant Tracking System) aapko jaldi pass karde aur aapki **Shortlist** hone ki probability bohot high ho jaye! Isme 2-stage ATS evaluation hoti hai: Pehle purane resume ka score dikhata hai, aur AI generation ke baad naye resume ka improved score dikhata hai (Before vs After).

---

## 🛠 Tech Stack & Libraries (Kaunsi Cheez Kyun Use Hui Hai?)

Yeh project ek modern scalable architecture (Frontend: Next.js + Backend: Node/Express) par banaya gaya hai. Har tool aur library ka apna specific maqsad hai jo neechay detail me bataya gaya hai:

### 1. Frontend Technologies
- **Next.js (App Router) & React:** Frontend ka core framework jo blazing fast development aur app routing provide karta hai. Is project me client-side interactivity bohot hai isliye Next.js ko as a modern React meta-framework use kiya gaya hai.
- **Tailwind CSS:** Styling aur UI design ke liye. Custom class names likhne ki jhanjhat se bachne aur responsive design banane ke liye.
- **Lucide-React:** User interface mein pixel-perfect aur modern icons (jaise user icons, checkmarks, file uploads) show karne ke liye is icon library ko use kiya gaya hai.

### 2. Backend API & Architecture
- **Node.js & Express.js:** RESTful API server banane ke liye jo client aur AI engine ke darmiyan main interface hai.
- **TypeScript:** Pure project mein type safety rakhne ke liye taake development ke dauran run-time errors se bacha ja sake.
- **Prisma (ORM):** Database operation ko asaan aur secure banane ke liye (SQL injection prevention). Yeh TypeScript type definitions automatically generate karta hai jisse database tables se connect karna extremely smooth ho jata hai.
- **PostgreSQL:** Primary relational database jahan users ka data, unke resumes, cover letters aur AI ki generated job histories (versions) waghaira save hoti hain.

### 3. File Processing & Document Management
Jab user apna resume daalta hai toh wo system me kaise process hota hai:
- **Cloudinary:** Users jo original PDF ya DOCX file (resume/cover letter) upload karte hain, un files ko efficiently cloud par safely sakhne (store karne) ke liye Cloudinary ka storage system use hua hai taake server ka apna storage full na ho aur load fast ho.
- **Multer:** Express middleware jo users ki uploaded multipart/form-data (jaise PDFs ya Word files) ki HTTP requests ko handle karne aur files ki buffer tak access dene ke liye.
- **pdf-parse:** Agar user PDF upload karta hai, toh text (skills/experience) parse nikalne ke liye ye library use ki gayi hai, taake AI ko text form me data diya ja sake.
- **mammoth:** Agar user `.docx` upload karta hai, toh ye PDF parse ki tarah `.docx` file se plain text nikalta hai, and even HTML extract kar leta hai jis se URLs (links) barqarar rehte hain.
- **pdf-lib:** Jab AI apna tailored version generate kar leta hai, aur user usko wapas PDF form mein download karna chahta hai, toh naya fresh aur formatted PDF server side par manually draw/create karne ke liye `pdf-lib` use hua hai.
- **docx:** Resume download ke dauran naya `.docx` document proper table of contents, paragraphs, font size aur bold italic styling ke sath code ke through conditionally design/generate karne ke liye banaya gaya package.

### 4. Background Jobs & Queue Automation
- **BullMQ & Redis:** AI resumes generate karne me 10 se 30 seconds lag jate hain! Agar direct HTTP request me AI ko call karenge toh browser API "timeout" ho jaye gi ya user ka connection drop ho jaye ga. **BullMQ** se hum ek background "Queue" banate hain. Request aati hai, hum usko job queue (Redis me save) me dal dete hain. Background workers (jo independent hain) aram se AI call karte hain. Jab tak frontend real-time me request status **poll** karta rehta hai (ki resume bana ya nahi?) aur jese hi job mukammal hoti hai (status ready!), result screen par aajjata hai.

### 5. Artificial Intelligence
- **Groq SDK (LLaMA 3) & Anthropic/Google AI:** Main dimaag! Groq AI model LLaMA (open source LLM) use kar ke purane resume aur job description ka comparision karta hai, json form me ATS match score nikalta hai, aur automatically missing technical keywords ko paragraphs ke ander fit karta hai bina farz kiye/lie. Result JSON form me ata hai.

### 6. Security, Validation & Logging
- **Zod:** Backend API endpoints (e.g. signup, job submit) par data validation karne ke liye. Taake agar frontend se koi galat form structure (jaise password ki length choti) aaye, toh backend wahi error dedu kare aur app crash na ho.
- **bcryptjs & jsonwebtoken (JWT):** User ke password ko safely encrypt/hash kar ke DB mein save karne ke liye (`bcryptjs`) aur session manage karne / protect-route ke liye token issue karne (`jsonwebtoken` ya HTTP-only cookies).
- **helmet & cors:** Express me extra security layers. Helmet HTTP headers set karta hai (XSS/clickjacking attacks rookne ke liye) aur CORS (Cross-Origin Resource Sharing) specific frontend domians ko API access allow karta hai.
- **express-rate-limit:** DDOS aur bar bar call hone wale API endpoints (e.g., login abuse, AI generate queue limit abuse) se account/server ko secure rakhne ke liye limit lagati hai (jaise "only 100 requests per 15 mins").
- **winston:** Application ki monitoring ke liye advanced logging mechanism, console pe safai ke sath logs (errors, warnings) store/show karti hai (rang-birange text ke sath) bajaey sada `console.log()` ke, jis se server ki activities ko easily track kiya jata hai.

---

Ye pura stack effectively multiple enterprise designs pattern follow karta hai jese **Message Queuing (BullMQ)**, **Microservices-esque Separation (Workers vs API handlers)** aur **AI Prompt Engineering** in backend APIs. Ek true Full-Stack enterprise application.
that should be completed 