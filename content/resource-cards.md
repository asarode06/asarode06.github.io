<!--
================================================================================
  RESOURCE CARDS — the brick, ore and sheep decks.
================================================================================

  Two of the five decks are NOT in this file, because their cards are the same
  writing as a tile elsewhere on the board and are authored once:

    wood   → content/projects.md   (a wood card is a project)
    wheat  → content/experience.md (a wheat card is a role)

  What's left lives here:

    brick  a specific class I took, and what I actually took away from it
    ore    a specific skill, and where I picked it up
    sheep  a random fun fact about me

  Keys:
    resource   required — brick | ore | sheep
    title      required — shown in the panel header and on card hover
    term       brick only, required — the semester I finished it, as
                          `Fall 2025` / `Spring 2026` / `Summer 2025`. The time
                          machine reads this: a class is in the brick deck only
                          once its term has ENDED (Fall→Dec, Spring→May,
                          Summer→Aug), and the term is shown on the card.
    from       ore only, required — the id of the role or project where the
                          skill was picked up (`uasl`, `aaoi`, `cipher-arena`,
                          …). The date is derived from that entry rather than
                          written twice, so it can never drift; the card's own
                          prose should say the same thing in words.
    subtitle   optional — one line under the title in the panel header
    label      optional — overrides the category caption printed on the card
                          face (defaults to Class / Skill / Fun fact)
    id         optional — the URL hash (#card/<id>); defaults to a slug of the
                          title, and changing it breaks old links

  The body is markdown: headings, bullets, **bold**, `code`, > quotes, tables,
  links, images. External links open in a new tab. Drawn card art goes in
  `public/art/cards/` and is linked as `/art/cards/<file>`; the brand marks on the ore
  cards are SVGs sitting together in `public/skills/`, authored as ordinary images so
  each one is dealt out as a taped-down print like any other picture; real screenshots and
  photos for a class go in `public/courses/<course>/` and are resized to WebP at
  build time, so drop the original in. Nothing is ever captioned: a run of images
  in one paragraph is dealt out as a pile of prints, and whatever needs saying
  about them belongs in the prose above. A PDF is not an image — link it from
  `links:` (`Our chess engine report (PDF) | /courses/ML/<file>.pdf`). A card
  panel scrolls, so `<!--more-->` isn't needed — but it works, and both halves
  are shown.

  ORDER MATTERS. The first card of each resource is dealt into the starting
  hand. Every one after it is locked in that resource's deck until the player
  rolls a 7 and drops the robber on a plain tile of that resource — each robbery
  deals the next card down. Put your strongest first. Add as many as you like;
  the board tells the player when a deck runs dry. (More precisely, the first
  card that EXISTS YET is the one dealt — the time machine can rewind to before
  a class was passed or a skill was learned, and that card is then simply not in
  the deck.)

  SHEEP ARE EXEMPT. Fun facts have no date and are never filtered: they are who
  I am, not something I did, so they are in the deck at every point on the
  timeline. That also guarantees one deck is never empty, which is what keeps
  the deep past playable at all.
================================================================================
-->

+++
resource: brick
title: Systems & Networks
subtitle: Sockets, scheduling, and where the abstractions leak
term: Spring 2026
+++

Learned how computers and the internet actually work! Covered organization of the processor, memory hierarchy, storage devices, parallel processors, networking hardware, software abstractions in operating systems, and networking protocols.

## What skills did I gain? What did I do?

- Learned how to design and build a basic pipeline processor
- Designed and implemented various process scheduling algorithms in C (FCFS, SRTF, Priority, Round Robin)
- Designed and implemented a custom transport protocol in C
- Achieved 4.08x speedup on a processor that I built on my own in CircuitSim (reduced all instructions to 1 clock cycle and made FETCH macrostate run parallely with some instructions)

The speedup processor was the hardest thing I have built, and the datapath below is the whole
of it: the LC-5200 as one sheet, with the microcontroller at the bottom driving every gate and
mux above it. The last screenshot is my transport protocol surviving a deliberately corrupted
link, retransmitting each packet the checksum caught until the receiver finally ACKs it.

![Average speedup across all tests: 4.08x](/courses/Systems_Networks/1_speedup.jpg)
![The grader's comment on my datapath report](/courses/Systems_Networks/2_ta-comment.jpg)
![My LC-5200 datapath in CircuitSim](/courses/Systems_Networks/3_lc5200-datapath.png)
![The transport protocol retransmitting through simulated corruption](/courses/Systems_Networks/4_transport-protocol.jpg)

+++
resource: brick
title: Machine Learning
subtitle: Learned the fundamentals and theory behind machine learning
term: Spring 2026
links:
  - Our chess engine report (PDF) | /courses/ML/MADE_A_LITERAL_CHESS_ENGINE.pdf
+++

Learned about MLE, KMeans, PCA, Lin Reg, Neural Networks, and much more! Also, I worked on a ML project along with some classmates. Our project focused on using different types of NNUEs for the evaluation function of a chess engine!

We trained three variants of the same network (a plain one, one whose output layers are stacked
and picked by piece count, and a mixture-of-experts with a learned router) and played them off
against each other and against Stockfish. The full write-up is linked below.

+++
resource: brick
title: Design & Analysis of Algorithms
subtitle: What it actually changed about how I write code
term: Fall 2025
+++

Learned about Divide and Conquer Algs, Dynamic Programming, Graphs, and NP Completeness.

Basically solved a bunch of leetcode problems. BUT, instead of actually programming solutions to them, I had to describe algorithms in plain english and sometimes use some fancy math notation. Also, had to write proofs and reductions for NP completeness.

## What skills did I gain? What did I do?

- Learned how to conceptualize algorithms and complex logic better
- Got better at DP / Graph / Recursion / Backtracking leetcode problems and actually understood the theory behind some of these concepts
- Learned how to code without coding (write good/clear pseudocode)

![A recursion tree solved with the Master Theorem](/courses/Design_Algs/1-recursion-tree.png)
![A dynamic programming table filled in for longest common subsequence](/courses/Design_Algs/2-dp-table.png)
![A weighted undirected graph](/courses/Design_Algs/3-weighted-graph.png)
![Karp's tree of reductions from satisfiability](/courses/Design_Algs/4-np-reductions.png)

+++
resource: brick
title: Artificial Intelligence
subtitle: Fundamental concepts related to AI
term: Fall 2025
+++

Learned about fundamental concepts related to AI like decision trees, neural networks, search algorithms, Markov Decision Processes, RL, and more.

I got to apply these concepts in various HW assignments where I built agents to complete a text
adventure game and built neural networks using PyTorch to classify different types of clothing.

The first screenshot is a solved MDP: every arrow is the optimal move out of that square once
value iteration has settled, with the red squares being the ones that hurt to stand on. The other
two are the clothing classifier, which got to about 88% validation accuracy on Fashion-MNIST
without the two curves ever pulling apart, so it was actually learning (not just memorizing / overfitting).

![Policy visualization of a solved MDP grid](/courses/AI/policy-visualization.png)
![Fashion-MNIST samples labelled Dress and Sandal](/courses/AI/fashion-mnist.png)
![Training and validation loss and accuracy over ten epochs](/courses/AI/training-curves.png)

+++
resource: brick
title: Low Level Programming
subtitle: Assembly, memory, and what a pointer actually is
term: Fall 2025
+++

Building up from logic gates to a working processor to assembly all the way to C. The class that made me realize computers aren't magic.

Writing assembly instructions by hand also helped me better understand what is happening under the hood when I'm using for loops, conditionals, functions, local variables, global variables, etc in a programming language.

Below is the LC-3 I wired up in CircuitSim, and the same machine running my assembly in LC3Tools,
printing a box out of letter Hs one character at a time.

![The LC-3 datapath I built in CircuitSim](/courses/LowLevel/lc3-datapath.png)
![My assembly running in LC3Tools, printing an H made of Hs](/courses/LowLevel/lc3tools.png)

+++
resource: brick
title: Data Structures & Algorithms
subtitle: The vocabulary everything since has been written in
term: Spring 2025
+++

Lists, trees, heaps, hash tables, and the sorting algs, implemented rather
than imported, which is the entire point. Every performance conversation I have
had since has involved at least some concept that I learned in this class.

[CSVistool](https://csvistool.com) helped me out so much in this class. I could see what happens step by step for each algorithm and why based on the pseudocode and visualization next to it.

![CSVistool stepping through Dijkstra's on a weighted graph](/courses/DSA/csvistool-dijkstra.png)

+++
resource: brick
title: Object Oriented Programming
subtitle: My first semester at Tech
term: Fall 2024
+++

Inheritance, polymorphism, encapsulation, abstraction. The fundamentals of OOP and more. I learned it! Also, did some JavaFX stuff to apply the OOP concepts I learned.

![A JavaFX form for recording and sorting startup ideas](/courses/OOP/javafx-idea-form.png)

+++
resource: ore
title: Kubernetes
subtitle: Learned on a fleet of ~3,000 virtual devices
from: aaoi
+++

QuantumLink, the cloud controller at Applied Optoelectronics, is dozens of services on **GKE**:
device provisioning, telemetry ingestion, alarm processing, firmware rollouts. I managed the
virtual gateway deployments and ran end to end remote download tests across ~3,000 virtual devices. I also used a dev GKE environment to test development changes made to services I was developing features for.

![The Kubernetes logo](/skills/kubernetes.svg)

+++
resource: ore
title: PyTorch
subtitle: Built and trained from scratch, not fine tuned off a shelf
from: uasl
+++

The Urban Audio Sensing Lab's pedestrian classifier: log-mel spectrograms into
**VGGish**, VGGish embeddings into a network that predicts how busy a street is from sound alone.
It landed at **71.7% balanced accuracy**, and balanced accuracy is what we reported because a quiet
street is far more common than a crowded one.

Most of the work was feeding the thing rather than building it. The ground truth labels came from
running **Mask2Former** over 2.9M video frames.

![The PyTorch logo](/skills/pytorch.svg)

+++
resource: ore
title: Python
subtitle: The one thread running through almost all of it
from: uasl
+++

At the Urban Audio Sensing Lab it was the whole pipeline: **Pandas** and **NumPy** for the time
series work, **PyTorch** for the model, Mask2Former runs to label 2.9M frames. At AOI, it was the polling engine and the anomaly detection pipeline.

![The Python logo](/skills/python.svg)

+++
resource: ore
title: Redis
subtitle: The polling engine's short term memory
from: aaoi
+++

Sat in front of **PostgreSQL** in the polling engine I built at AOI, the one
that pushes automatic config changes out to amplifiers in the field and cut device failures by
about 20%.

![The Redis logo](/skills/redis.svg)

+++
resource: ore
title: MongoDB
subtitle: Where 900+ Cipher Arena accounts actually live
from: cipher-arena
+++

**Atlas** through **Mongoose**, holding user accounts, live game state, the Elo leaderboard and
full match history for Cipher Arena. SustainaView leans on it as well, for accounts and saved
wishlists.

Schemaless is wonderful right up until the third time you change what a match document looks like
and every old one is still sitting there in the shape you abandoned. That's why Mongoose is goated.

![The MongoDB logo](/skills/mongodb.svg)

+++
resource: ore
title: Blob / Object Storage
subtitle: The same problem in three projects, solved three different ways
from: cipher-arena
+++

It started as profile image storage for Cipher Arena, came back for room photos in SustainaView,
and then at Bits of Good became the actual point of the work: Juno's file service had to do end to
end deletion across **S3** and **Azure Blob** without the caller ever knowing which one it was
talking to.

That last one is the difference between using a bucket and designing around one. When a team lands
free Azure credits, switching providers should be a credentials change in a dashboard, not a
rewrite.

![The Amazon S3 logo](/skills/amazons3.svg)

+++
resource: ore
title: Docker
subtitle: How Cipher Arena actually gets to the internet
from: cipher-arena
+++

Cipher Arena ships to **Fly.io** as a container, so Docker is the whole of what stands between my
laptop and 900+ people playing the game.

![The Docker logo](/skills/docker.svg)

+++
resource: sheep
title: I met Po Shen Loh!
subtitle: My math goat!
links:
  - His YouTube channel | https://www.youtube.com/@PoShenLoh
+++

Used to watch his YT channel a lot during COVID. He made me enjoy math!

![Meeting Po Shen Loh](/extras/hello.jpeg)

+++
resource: sheep
title: Stormed the field for UMiami upset!
subtitle: Gooooooooooooooooooooooo Jackets!
+++

Took a pic w/ Buzz. You can see the fg post being taken down in the background too 💀💀💀💀.

![Meeting Po Shen Loh](/extras/111111.jpeg)

+++
resource: sheep
title: I met John Toebes!
subtitle: The codebusters and FTC goat!
+++

Made THE test generation tool for codebusters. National event supervisor for codebusters.

![Meeting John Toebes](/extras/cool.jpeg)

+++
resource: sheep
title: BROWNIES
subtitle: so fun
+++

Made brownies w/ the bog team. TBH, all I did was pour the brownie mix 😭😭😭😭😭.

![Brownie Mix](/extras/team-baking.jpg)
