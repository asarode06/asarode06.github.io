<!--
================================================================================
  RESUME — the text of the résumé, as text.
================================================================================

  This is the same document as `public/resume/Akash_Sarode.pdf`, transcribed.
  The PDF is still what a recruiter downloads and it's still shown as a print at
  the bottom of the tile — but a Letter page painted 300px wide puts 10pt type at
  about 5px, and on a phone it can't be painted wider than the screen, so no
  image of it is ever comfortably readable. Real text is, at any width. That's
  what this file is for.

  KEEPING IT HONEST. These words and the PDF's are two copies of one document, so
  a new PDF means editing this too, and a résumé that disagrees with itself is
  worse than either version alone. The bullets below are ordered and worded
  exactly as the PDF has them so the two can be diffed by eye.

  Keys:
    section   required — the heading this entry files under. Entries are grouped
                         in the order the sections first appear here, so moving a
                         block moves its whole section.
    title     required — the employer, school or project
    subtitle  optional — the role. Sits under the title, at the left.
    dates     optional — right-aligned against the title. Same `Mon YYYY - Mon
                         YYYY` shape as content/experience.md uses.
    location  optional — right-aligned against the subtitle. (Not `where:` —
                         plugins/content.js uses that key for the file and line
                         an entry was parsed from, and would overwrite yours.)
    stack     optional — comma-separated; the `|` half of a project's title line
    heading   optional — `heading: no` drops the entry's own title line, leaving
                         just its rows under the section heading. The closing
                         skills block is the only thing shaped that way: it has
                         no employer, no dates and no bullets, so a title line
                         above it would be a heading under a heading. A `title:`
                         is still required — it's what the entry's id comes from.
    rows      optional — an indented `- Label | one, two, three` list, laid out
                         as label-and-values rows. Deliberately NOT a markdown
                         `- **Label:** a, b, c` list: a list shaped like that is
                         read as a *ranking* and numbered 1, 2, 3 (see the
                         RANKINGS note in tiles.md), which is wrong for a set of
                         skills where nothing is ranked against anything.

  The body is an ordinary markdown bullet list — the résumé's own bullets, one
  per line.
================================================================================
-->

+++
section: Education
title: Georgia Institute of Technology
subtitle: BS in Computer Science
dates: May 2028
location: Atlanta, GA
rows:
  - Threads | Intelligence, Systems & Architecture
  - GPA | 3.91 / 4.00
  - Core courses | Machine Learning, Data Structures & Algorithms, Object Oriented Programming, Artificial Intelligence, Low Level Programming, Design & Analysis of Algorithms, Systems & Networks
+++

+++
section: Experience
title: Vanguard
subtitle: Incoming Software Engineering Co-op
dates: Sep 2026 - Apr 2027
location: Charlotte, NC
+++

- Will develop Fullstack & AI workflow solutions for investors in the Advice and Wealth Management Technology division

+++
section: Experience
title: Applied Optoelectronics
subtitle: Software Engineering Intern
dates: May 2026 - Aug 2026
location: Duluth, GA
+++

- Built backend system in Redis & PostgreSQL polling engine for automatic config changes, cutting device failures ~20%
- Managed virtual gateway deployments on GKE (Kubernetes) to run e2e remote download tests for ~3k virtual devices
- Developed anomaly detection self healing pipeline; improved macro accuracy ~5% on 10k spectrum captures

+++
section: Experience
title: Bits of Good: Juno
subtitle: Software Developer
dates: Jan 2026 - May 2026
location: Atlanta, GA
+++

- Engineered e2e file deletion feature across API gateway, S3, & Azure Blob handlers used by 5 active org project teams
- Authored a TypeScript gRPC SDK and React dashboard to streamline account approval workflows for 50+ engineers
- Built a Next.js integration for Juno file storage using Backblaze B2 & Azure Blob for simplified project onboarding

+++
section: Experience
title: AI Makerspace Nexus
subtitle: Software Engineer
dates: Aug 2025 - Dec 2025
location: Atlanta, GA
+++

- Developed a RAG study tool using FastAPI and LangChain to generate quizzes from course PDFs
- Implemented RAG features including ChromaDB vectorization for semantic search across document embeddings
- Engineered a Python FastAPI and SQLite backend to validate and store unstructured JSON model outputs

+++
section: Experience
title: Urban Audio Sensing Lab
subtitle: Undergraduate Research Assistant
dates: Dec 2024 - May 2026
location: Atlanta, GA
+++

- Architected a PyTorch pedestrian classifier w/ 71.7% balanced accuracy using mel-spectrogram feature extraction (STFT)
- Generated pedestrian labels by running Mask2Former model on 2.9M frames & compiled detections into CSV data
- Analyzed pedestrian time-series data w/ Pandas and NumPy to extract insights for ML model development

+++
section: Projects
title: Cipher Arena
stack: SvelteKit, Socket.IO, MongoDB, Node.js, AWS S3
dates: Mar 2025 - Jun 2025
+++

- Built a real-time multiplayer cryptogram web app for 900+ users, featuring public & private cipher battles, detailed public profiles, a leaderboard w/ Elo rankings, & a practice mode w/ infinite drills for 10+ cipher types
- Developed a WebSocket server using Node.js & Socket.IO to manage games & ensure low-latency communication
- Built REST API for game logic, leaderboard queries, profile updates, & cipher generation/validation
- Implemented secure authentication using JSON Web Tokens for session management & nodemailer for email verification

+++
section: Projects
title: Gesture Control
stack: JavaScript, TensorFlow.js
dates: Jun 2025 - Jul 2025
+++

- Built a Computer Vision Chrome extension for gesture based browsing, featuring customizable action mappings
- Trained a TensorFlow model on a proprietary dataset of 67k samples to classify 10 gestures w/ 93.7% accuracy

+++
section: Projects
title: SustainaView
stack: Gemini API, React Native, Express.js, MongoDB, Google Shopping API
dates: Sep 2025
+++

- Developed an AI mobile app using React Native, Expo, & Gemini API for eco-friendly room makeover suggestions
- Engineered a full-stack solution w/ an Express.js backend, JWT auth, MongoDB Atlas, & AWS S3 for storage
- Integrated SerpAPI & Google Shopping API for real-time price comparisons & multi-retailer product listings
- Implemented a two-stage Gemini AI pipeline for room analysis, recommendations, & before/after visualizations

+++
section: Technical Skills
title: Technical skills
heading: no
rows:
  - Languages | Python, C++, JavaScript, TypeScript, Java, HTML/CSS
  - Frameworks & tools | Kubernetes, MongoDB, AWS, GCP, Git, Docker, LangChain, FastAPI, PyTorch, Pandas, NumPy
  - Certifications | AWS Certified Cloud Practitioner
  - Publication | Audio-Based Pedestrian Detection in the Presence of Vehicular Noise (arXiv:2509.19295)
  - Awards | FTC Robotics State Control/Software Award, 2nd at RoboTech Hackathon, REU Research Award
+++
