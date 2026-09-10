<!--
================================================================================
  PROJECTS — written once, shown in two places.
================================================================================

  Each entry below is one project, and it feeds BOTH:

    · the Projects tile — a card in the grid, opening into the full write-up
    · the wood deck     — wood cards are projects, in this file's order

  So the card you flip over in the hand and the panel you reach through the
  Projects tile are the same words. Edit here, both move.

  Keys:
    title      required — the heading everywhere this project appears
    subtitle   optional — one line under it; also the blurb on the grid card
    id         optional — the URL hash (#projects/<id>, #card/<id>); defaults to
                          a slug of the title, and changing it breaks old links
    dates      required — when it happened, as `Mon YYYY` or `Mon YYYY - Mon YYYY`.
                          The time machine reads this: a project is in the wood
                          deck only once its start month has arrived, and the
                          date is shown wherever the project appears. Parsed by
                          src/timeline.js, which fails the build on a date it
                          cannot read.
    stack      optional — comma-separated; rendered as a row of chips
    links      optional — indented `- Label | https://url` lines
    card       optional — `no` keeps this project out of the wood deck; it still
                          appears under the Projects tile

  The body is markdown. `<!--more-->` on its own line folds it: everything above
  is the teaser, everything below is the rest. Nothing showing a project has a
  height limit, so both halves are rendered together — the fold is there if you
  want a natural break, not something you have to use.

  ORDER MATTERS. The first project here is the wood card dealt into the starting
  hand; the rest are earned one at a time by rolling a 7 and dropping the robber
  on a plain wood tile. Put your strongest first.

  PHOTOS. Screenshots and photos go in `public/projects/<project>/` and are
  linked as `![Alt](/projects/CipherArena/landing.png)`. That's the same split
  the roles use: `public/projects/` and `public/experiences/` are the real
  pictures, `public/art/` is the hand-drawn board art.

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
  through the same `links:` list as any other URL — see `edwin-io` below.
================================================================================
-->

+++
title: Cipher Arena
subtitle: Real-time multiplayer cryptogram game for 900+ users
dates: Mar 2025 - Jun 2025
stack: SvelteKit, Socket.IO, MongoDB, JWT, Amazon S3, Docker, Fly.io
links:
  - Play Cipher Arena | https://cipherarena.com/
  - Source on GitHub | https://github.com/asarode06/CipherArena
  - YouTube channel | https://www.youtube.com/@CipherArena
+++

- Built a full-stack SvelteKit application with 900+ users leveraging REST API
  endpoints, server-side load functions for secure data fetching, form actions,
  and protected route handling for authenticated access.
- Integrated Socket.IO for real-time multiplayer communication.
- Structured data storage with a MongoDB Atlas cloud database (via Mongoose) for
  user accounts, game state, leaderboards, and match history.
- Implemented JWT-based authentication, an elo ranking system, Amazon S3 for
  profile image storage, node-cron for scheduled backend tasks, and nodemailer
  for email verification and password recovery.
- Deployed on Fly.io using Docker containers.

![The Cipher Arena landing page](/projects/CipherArena/landing.png)
![A head-to-head match in progress](/projects/CipherArena/match.png)
![The pre-game lobby with both players' Elo](/projects/CipherArena/lobby.png)
![A solved cipher with the round's stats](/projects/CipherArena/solved.png)
![The Elo leaderboard](/projects/CipherArena/leaderboard.png)

+++
id: edwin-io
title: Edwin IO
subtitle: Manifest V3 Chrome extension with a custom gesture model
dates: Jun 2025 - Jul 2025
stack: JavaScript, Node.js, TensorFlow.js, Manifest V3
links:
  - Get it on the Chrome Web Store | https://chromewebstore.google.com/detail/edwin-io/bnfehhpejojffoplpnimdodfidgfmhdc?pli=1
  - Source on GitHub | https://github.com/asarode06/Edwin-IO
  - Custom gesture model report (PDF) | /projects/EdwinIO/Edwin_IO_Custom_Gesture_Model_Report.pdf
+++

- Engineered a Manifest V3 Chrome extension using JavaScript and Node.js,
  demonstrating skills in full-stack development and browser automation.
- Developed a complete TensorFlow.js machine learning pipeline, from data
  collection (67k samples) to training a custom neural network (93.7% accuracy).
- Designed for performance by implementing asynchronous message passing and using
  an offscreen document for model inference, ensuring a responsive UI.

![The live camera feed classifying a gesture](/projects/EdwinIO/live-feed.png)
![The dashboard, live feed above the mappings](/projects/EdwinIO/dashboard.jpg)
![Mapping each gesture to a browser action](/projects/EdwinIO/gesture-mapping.png)
![The hand pose data collection tool](/projects/EdwinIO/data-collection.png)
![The extension popup](/projects/EdwinIO/popup.png)

+++
title: SustainaView
subtitle: AI-powered eco-friendly room makeovers, from a photo
dates: Sep 2025
stack: React Native, Expo, Express.js, Gemini API, AWS S3, MongoDB Atlas, SerpAPI
links:
  - Source on GitHub | https://github.com/asarode06/SustainaView
  - Demo video | https://www.youtube.com/watch?v=pTdhk9g6eUY
+++

SustainaView is an AI-powered mobile app that generates eco-friendly makeover
suggestions for a room based on a given photo.

- The application is built with React Native and Expo, featuring a Express.js
  backend, and it leverages AWS S3 for secure image storage and MongoDB Atlas for
  user data.
- The core AI functionality relies on the Google Gemini API, utilizing Gemini
  Vision for room analysis and AI-powered image generation for visualizing the
  makeovers.
- To complete the user experience, SerpAPI and Google Shopping API are integrated
  to provide price comparisons and specific product listings, which can be saved
  to a user's wishlist.

![A room and its generated sustainable vision](/projects/SustainaView/room-visualization.png)
![Sustainable product listings with prices](/projects/SustainaView/product-listings.png)
![The saved wishlist](/projects/SustainaView/wishlist.png)
![The tech stack, layer by layer](/projects/SustainaView/tech-stack.png)

+++
title: LockedOut
subtitle: Keyless entry system (2nd place at RoboTech 2025)
dates: Mar 2025
stack: ESP32, ESP-NOW, Blynk IoT, Arduino
links:
  - Devpost | https://devpost.com/software/lockedout
  - Source on GitHub | https://github.com/amoghkon/ak-robotech25
+++

- Placed 2nd place in Georgia Tech’s RoboTech 2025 Hackathon.
- Developed a keyless entry system to prevent student lockouts.

This smart lock features a keypad for PIN authentication and a custom-built
linear actuator to operate the door handle. The system is built on two ESP32
microcontrollers communicating via the ESP-NOW protocol. It also integrates with
the Blynk IoT platform, allowing users to remotely change the passcode and
receive push notifications on their phones upon entry.

![The team demoing LockedOut](/projects/LockedOut/team-demo.png)
![The Blynk app unlocking the door](/projects/LockedOut/blynk-app.png)
![The sender and receiver sketches side by side](/projects/LockedOut/esp-now-code.png)

+++
id: inflation-etf-quant
title: Inflation ETF Quant Project
subtitle: Time-series analysis of how inflation impacts sector ETFs
dates: May 2025
stack: Python, PCA, OLS regression, Pandas
links:
  - Source on GitHub | https://github.com/asarode06/InflationETFQuantProject
  - Final project notebook (PDF) | /projects/QuantProject/Akash_Quant_Final_Project_Notebook.pdf
  - Project report (PDF) | /projects/QuantProject/Akash_Quant_Project_Report.pdf
+++

- Built a Python-based time-series analysis pipeline to investigate how inflation
  impacts sector ETFs (XLP, XLY).
- Applied PCA for dimensionality reduction, conducted OLS regression, and
  visualized rolling correlations using CPI data to explore sector resilience
  under inflationary pressure.

![Rolling volatility of XLP against XLY under high and low inflation](/projects/QuantProject/key-insight.png)
