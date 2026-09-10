<!--
================================================================================
  TILES — the modal you get when you click one of the board's content hexes.
================================================================================

  One entry per content tile. Which hex it is, what resource it's made of, what
  number token it carries and where it sits on the board all stay in
  `src/data.js` (that's board layout, not writing) — this file is the words.

  Keys:
    tile       required — must match a tile id in TILES in src/data.js:
                          education · resume · experience · about-me ·
                          projects · skills · desert
    title      required — the modal heading, and the label on the hex
    subtitle   optional — one line under the title, inside the header band
    stack      optional — comma-separated; rendered as a row of chips
    links      optional — indented `- Label | https://url` lines

  The body is markdown: paragraphs, `##` headings, bullet lists, **bold**,
  links, images, tables. `<!--more-->` on its own line folds it, but nothing
  here uses that — a tile modal shows the lot.

  RANKINGS. A list where *every* item is `**Label:** first, second, third` is
  laid out a row each — the label as a small caption over its picks, and the
  picks numbered 1, 2, 3... in the order you wrote them — rather than as
  bullets that wrap. See "About me". It's the shape for a set of short ranked
  lists that would otherwise eat a screen.

  The bold label is what opts a list in, so one item without one leaves the
  whole list an ordinary bulleted list. Picks split on commas, so a pick can't
  contain one of its own. The numbering is the point: don't reach for this for
  values that aren't in a meaningful order.

  Two tiles have machinery bolted on by the renderer, below whatever you write:
    projects   the grid of project cards (authored in `projects.md`)
    resume     the embedded PDF, prepended above the body
  And two are special cases:
    experience clicking it lifts the road chain instead of opening a modal, so
               only `title` here is ever used (for the prev/next footer labels)
    desert     the easter egg. Its `lines:` list is cycled one click at a time;
               add to the end and the joke just gets longer.
================================================================================
-->

+++
tile: education
title: Education
subtitle: Georgia Institute of Technology · BS Computer Science, expected May 2028
+++

- **GPA 3.91 / 4.00**
- Threads: Intelligence + Systems & Architecture
- Coursework: Machine Learning, Artificial Intelligence, Data Structures &
  Algorithms, Design & Analysis of Algorithms, Systems & Networks, Low-Level
  Programming, Object-Oriented Programming

+++
tile: resume
title: Resume
subtitle: My resume with some highlights below
links:
  - Download resume (PDF) | /resume/Akash_Sarode.pdf
+++

- 3.91 GPA at Georgia Tech
- Intelligence + Systems & Architecture threads
- Expected graduation May 2028
- AWS Certified Cloud Practitioner
- published paper @ DCASE Conference

+++
tile: experience
title: Experience
subtitle: Every settlement and city on the board: research, internships, and club work
+++

Clicking this tile lifts the road chain off the map rather than opening a modal,
so this text is never rendered.

+++
tile: about-me
title: About me
subtitle: CS student at Georgia Tech. Interested in Cloud, AI, and FinTech!
+++

CS student at Georgia Tech. Interested in Cloud, AI, and FinTech!
---

## My top 5s

- **Board/Card Games:** Catan, Poker, Flip 7, Coup (Reformation), Moon Colony Bloodbath
- **Favorite File Types:** `.csv`, `.flac`, `.md`, `.svg`, `.gif`
- **Elite Ball Knowledge (EBK) NBA Players:** Andre Ingram, Garrett Temple, Ryan Hollins, Alec Burks, Steve Novak
- **Fruits:** Mango, Lychee, Pomegranate, Sungold Kiwi, Mandarin Orange
- **Taco Bell Food Items:** Avocado Ranch Chicken Stacker, Nacho Fries, Mexican Pizza, Chicken Chalupa, Crunchwrap Supreme
- **Big Nate Characters:** Gargantuan Nate, Daphne, Mr. Rosa, Chad, Mrs. Shipulski
- **Indian Movies:** 3 Idiots, Ante Sundaraniki, Maharaja, Ala Vaikunthapurramuloo, Srimanthudu
- **Favorite Git Commands:** blame, rebase -i, push --force-with-lease, stash, reflog

![A game of Catan mid-swing](/extras/awesome.jpeg)
![With Buzz on the field at a Georgia Tech game](/extras/111111.jpeg)
![The Bits of Good team out on a rooftop](/experiences/BitsOfGood/team-rooftop.jpg)
![Three of us in sunglasses with the price tags still on](/extras/tuff.jpeg)
![John Toebes](/extras/cool.jpeg)
![Making brownies with friends](/extras/team-baking.jpg)
![An FTC robotics clip](/extras/Mewing_FTC.gif)
![Lunch with the team at Applied Optoelectronics](/experiences/AOI/team-lunch.png)
![Po Shen Loh](/extras/hello.jpeg)
![Dinner with the lab after the DCASE workshop](/experiences/AudioSensing/dcase-dinner.jpg)

+++
tile: projects
title: Projects
subtitle: A small card grid of my best projects
+++

+++
tile: skills
title: Skills
subtitle: I'm a skilled settler aren't I.
groups:
  - wood | Languages | Python, C++, TypeScript, JavaScript, Java
  - ore | Infrastructure | Kubernetes, Docker, AWS, GCP, Git
  - wheat | Data & ML | PyTorch, LangChain, Pandas, NumPy
  - brick | Data stores | PostgreSQL, MongoDB, Redis
  - sheep | Web & backend | React, Next.js, SvelteKit, FastAPI
+++

I'm such a skilled settler aren't I. Click an ore card and you can learn more!

+++
tile: desert
title: Desert
lines:
  - Nothing grows here.
  - Still nothing.
  - You've clicked a desert three times. This says more about you than it does about the desert.
  - The robber isn't even here, he's out on a filler tile, judging you.
  - Two more and something happens. Probably.
  - One more.
  - 🐫 A lone camel wanders through.
  - Congratulations, you reached the end! Go check out Projects, there's real stuff over there.
+++
