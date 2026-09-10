<!--
================================================================================
  EXPERIENCE — written once, shown in four places.
================================================================================

  Each entry below is one role, and it feeds ALL of:

    · the road on the board  — one settlement or city per entry, left to right
    · the Experience showcase — a card floating above its own piece
    · that piece's own modal  — clicking the settlement/city on the board
    · the wheat deck          — wheat cards are roles, in this file's order

  So the card you flip over in the hand and the panel you reach from the road
  are the same words. Edit here, all four move.

  Keys:
    title      required — the role's employer/lab, the heading everywhere
    dates      required — shown as the eyebrow pill; also the road's left-to-right
                          order, so keep this file in chronological order
    piece      required — settlement | city | ghost
                          city = a full-time role, ghost = not built yet
    card       optional — `no` keeps this role out of the wheat deck; it still
                          appears on the road and in the showcase
    subtitle   optional — the job title, one line under the heading
    id         optional — the URL hash (#<id>, #card/<id>); defaults to a slug
    stack      optional — comma-separated; rendered as a row of chips
    links      optional — indented `- Label | https://url` lines

  THE FOLD MATTERS HERE. `<!--more-->` on its own line splits the body:

    above it   the teaser. This is all a collapsed showcase card has room for,
               so keep it to a few bullets or a short paragraph.
    below it   everything else — long-form write-up, photos, whatever. Shown on
               the expanded showcase card, in the milestone modal, and on the
               wheat card, none of which have a height limit.

  ORDER MATTERS TWICE. Left-to-right along the road, and the first entry is the
  wheat card dealt into the starting hand — the rest are earned by rolling a 7
  and dropping the robber on a plain wheat tile.

  PHOTOS. Real photos and scans (conference badges, posters, screenshots, team
  pics) aren't hand-drawn board art, so they live apart from it, in
  `public/experiences/<role>/`, and are linked as `![Alt](/experiences/<role>/x.jpg)`.
  Hand-drawn art for a role would go in `public/art/experience/` instead; both
  are linked the same way.

  Put them on their own lines, one after another with no blank line between: a
  paragraph that is nothing but images is dealt out as a *pile* of prints, and
  clicking one opens the whole pile in the photo viewer. Order is the order they
  are read in — the first one is the cover on top of the pile, and the first one
  the viewer shows.

  There are no captions anywhere on this site; a `"..."` title after the URL is
  ignored. The alt text is still worth writing — it's what a screen reader reads
  out — but nobody will see it. If a photo needs explaining, explain it in the
  prose around it.

  Drop photos in at full size. The build resizes each one into a ladder of WebP
  widths and serves whichever rung fits where it's being painted — a print in a
  pile costs ~12KB, and the big version is only fetched if someone opens it. See
  plugins/images.js. Shrinking or compressing a photo by hand before adding it
  only costs quality in the viewer.

  A non-image file (a PDF, say) can't be embedded in markdown at all, so it goes
  through the same `links:` list as any other URL — see `nexus` below.
================================================================================
-->

+++
id: uasl
title: Urban Audio Sensing Lab
subtitle: Undergraduate Research Assistant
dates: Dec 2024 - May 2026
piece: settlement
stack: PyTorch, Pandas, NumPy, Mask2Former
links:
  - Read the paper (2509.19295) | https://arxiv.org/abs/2509.19295
  - Check out the website | https://urbanaudiosensing.github.io/
+++

- Built PyTorch pedestrian classifier reaching **71.7% balanced accuracy**
- Generated training labels by running **Mask2Former** across 2.9M video frames
- Performed time series analysis and dataset curation using **Pandas** & **NumPy**
- Travelled to **Barcelona** to attend the DCASE Workshop!

<!--more-->

Knowing how busy foot traffic is in urban areas can be really useful for city planning. You can identify overcrowding, adjust the scheduling of public buses, widen crosswalks or sidewalks, decide where to place subway entrances, and much more. This type of data can be really useful, but at the same time it can be really difficult to collect at a large scale and without compromising people's privacy.

The goal of this research group was to build audio models that could help solve this problem. You can determine how busy specific urban areas are without using video data, which can be much more cost effective and ensure privacy. If you're worried about recorders picking up on private conversations, models can be small enough to process data on device so no raw audio data is ever stored.

Early versions of the model work by first converting audio data into log-mel spectrogram graphs, which
would be fed into VGGish (the backbone for our audio model). VGGish returns a vector embedding given this audio data. Therefore, by using ground truth information regarding how busy an urban area actually was, we can create an ML model that can predict pedestrian traffic given VGGish's vector embeddings. This "ground truth" information for training was collected by capturing video data from our testing site along with the audio data and running a local instance of Mask2Former to automatically label everything.

![Presenting our paper at DCASE 2025](/experiences/AudioSensing/dcase-talk.jpg)
![Standing by our poster in Barcelona](/experiences/AudioSensing/dcase-poster.jpg)
![Conference badge](/experiences/AudioSensing/dcase-badge.jpg)
![The lab out at dinner](/experiences/AudioSensing/dcase-dinner.jpg)

+++
id: nexus
title: AI Makerspace Nexus
subtitle: Software Engineer
dates: Aug 2025 - Dec 2025
piece: settlement
stack: FastAPI, LangChain, ChromaDB
links:
  - Read the VIP final notebook (PDF) | /experiences/AIMakerspace/VIP_Final_Notebook.pdf
+++

- RAG-based study tool generating quizzes from course PDFs with **FastAPI** and **LangChain**
- **ChromaDB** vectorization for semantic search over course material
- Engineered **SQLite** backend to store generated quiz questions and collect human feedback

<!--more-->

Drop in a course PDF, get quizzes back that are actually about the material.

You may be asking what's the difference between using this tool and just uploading course material to ChatGPT, asking it to generate a quiz for you instead.

Well, our application took advantage of human feedback to improve data quality. When users generated quiz questions, they had the option to select questions that they viewed as useful to be added to a public database. All students could access the questions in this database and give questions a thumbs up or down. TAs could also give written feedback for questions as well. This way, the platform could filter out poor quality practice questions and students would have high quality prep material.

+++
id: juno
title: Bits of Good: Juno
subtitle: Software Developer
dates: Jan 2026 - May 2026
piece: settlement
stack: TypeScript, gRPC, React, S3, Azure Blob
+++

- Implemented **e2e** file deletion across an API gateway, functional for **S3** and **Azure Blob**
- TypeScript **gRPC SDK** and a **React** dashboard shipped to 50+ engineers for account approval functionality
- Built a **Next.js** integration for Juno file storage using Backblaze B2 & Azure Blob for simplified project onboarding

<!--more-->

Juno is a central infrastructure API, integrating several services (auth, file storage, email, logging, db) to simplify and streamline project development. Instead of different project teams within Bits of Good having to implement their own versions of these services, they can just integrate Juno's services using the Juno SDK instead.

Juno also makes it much easier to switch between different cloud providers. Let's say Bits of Good receives a bunch of free Azure credits, but most projects currently use AWS S3 for file storage. Engineering Managers can simply access the Juno Dashboard, add Azure credentials for their project, and switch to using Azure Blob storage instead!

![Infrastructure Team showcase poster](/experiences/BitsOfGood/juno-poster.png)
![The infra team on a rooftop](/experiences/BitsOfGood/team-rooftop.jpg)
![Team selfie with brownies](/experiences/BitsOfGood/team-selfie.jpg)
![Presenting at the Bits of Good showcase](/experiences/BitsOfGood/showcase-night.jpg)

+++
id: aaoi
title: Applied Optoelectronics
subtitle: Software Engineering Intern
dates: May 2026 - Aug 2026
piece: city
stack: Redis, PostgreSQL, GKE, Kubernetes
+++

- Built backend system in **Redis & PostgreSQL** polling engine for automatic config changes, cutting device failures ~20%
- Managed virtual gateway deployments on **GKE** using **kubectl** to run e2e remote download tests for ~3k virtual devices
- Developed anomaly detection **self healing pipeline**; improved macro accuracy ~5% on 10k spectrum captures

<!--more-->

This internship really showed me how much I took the internet for granted. Because it's genuinely crazy how much needs to happen for your dumb-ahh twitter posts to go live on the site just to get 0 likes. When you click post, an HTTP request gets turned into bits, routed upstream across hundreds of miles through fiber optic cables, and reassembled by a server far far away in milliseconds. For you to watch youtube videos or doomscroll reels, billions and billions of bits get send back from a server hundreds of miles away all the way to your house.

I learned a lot of this already through my Systems and Networks class, but through my internship I had the opportunity to look at the technology and large scale systems that power the internet first hand. One of the major challenges with internet infrastructure is what ISPs call the "last mile", which is the final distance it takes for network data to reach your home. It's really expensive and inefficient for companies to install infrastructure like direct fiber to the home in order to handle the last mile. Instead, they've opted to use existing coaxial cable infrastructure for the last mile in an overall system called HFC (hybrid fiber-coaxial); basically use fiber for long distances and cable for the last distance to your house.

Applied Optoelectronics (AKA AOI) makes the amplifiers that keep the "last mile" running. Coax signals get weaker as they travel further, so these amplifiers are necessary to maintain a strong signal all the way to your home. A lot of people view this stuff as kinda outdated, but even though the underlying infrastructure is old, the actual technology behind it has advanced a lot to keep up with the demand for higher speed internet. Now, amplifiers have firmware for programmatically changing gain/tilt values or trigger alarms and transponders for communicating to the cloud. You can stream temperature data, power and frequency values, alarm data, and a lot more. All of this functionality allows internet connection to be a lot more reliable for millions of people, but it also makes the software architecture behind it a lot more complex. Virtual gateways are used to route packet data from thousands of amplifiers to the cloud. Within the cloud controller (called QuantumLink), dozens of service deployments exist to handle everything from device provisioning to telemetry ingestion to alarm processing to firmware rollouts. It all runs on Kubernetes on GKE for development and on-prem servers for actual actual customer deployments.

During my internship, I had the opportunity to develop features across the entire stack, I wasn't stuck in one corner of the system for three months. In a given week I'd be looking at a backend service to figure out why alarms weren't propagating to the dashboard, then to the virtual gateway manager to automate port assignment, then working with the AI team to build an automation pipeline for handling pilot loss anomalies. The experience may have dealt with many different services within the QuantumLink platform, but overall I gained a lot of real world experience with Kubernetes, Python, GitLab CI/CD, Jira, and more!

![QuantumLink Central](/experiences/AOI/quantumlink-dashboard.png)
![Team lunch](/experiences/AOI/team-lunch.png)

+++
id: vanguard
title: Vanguard
subtitle: Incoming Software Engineering Co-op, Wealth Management Technology
dates: Sep 2026 - Apr 2027
piece: city
+++

- Full-stack and AI-workflow solutions for advisor facing tools

<!--more-->

+++
id: grad
title: Graduation
subtitle: Not built yet
dates: May 2028
piece: ghost
card: no
+++

Coming soon... **I wonder** what happens next? Hopefully I come out of college a **champion**. Hopefully after graduating I live a **good life**. Hopefully my career will be full of home runs just like **Barry Bonds'**.
