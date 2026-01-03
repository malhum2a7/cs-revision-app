// src/data/sections.js
import { slugify } from "../utils/slugify";

const sections = [
  {
    id: 1,
    name: "Components of a Computer System",
    paper: 1,
    topics: [
      { name: "Processor components", textbookStart: 2 },
      { name: "Processor performance", textbookStart: 7 },
      { name: "Types of processors", textbookStart: 10 },
      { name: "Input Devices", textbookStart: 16 },
      { name: "Output Devices", textbookStart: 20 },
      { name: "Storage Devices", textbookStart: 25 },
    ],
  },
  {
    id: 2,
    name: "Systems Software",
    paper: 1,
    topics: [
      { name: "Functions of an Operating System", textbookStart: 30 },
      { name: "Types of Operating Systems", textbookStart: 35 },
      { name: "The nature of applications", textbookStart: 39 },
      { name: "Programming language translators", textbookStart: 44 },
    ],
  },
  {
    id: 3,
    name: "Software Development",
    paper: 1,
    topics: [
      { name: "Systems analysis methods", textbookStart: 52 },
      { name: "Writing and following algorithms", textbookStart: 57 },
      { name: "Programming paradigms", textbookStart: 64 },
      { name: "Assembly language", textbookStart: 69 },
    ],
  },
  {
    id: 4,
    name: "Exchanging Data",
    paper: 1,
    topics: [
      { name: "Compression, encryption and hashing", textbookStart: 75 },
      { name: "Database concepts", textbookStart: 82 },
      { name: "Relational databases and normalisation", textbookStart: 88 },
      { name: "Introduction to SQL", textbookStart: 95 },
      { name: "Defining and updating tables using SQL", textbookStart: 101 },
      { name: "Transaction processing", textbookStart: 106 },
    ],
  },
  {
    id: 5,
    name: "Networks and Web Technologies",
    paper: 1,
    topics: [
      { name: "Structure of the internet", textbookStart: 111 },
      { name: "Internet communication", textbookStart: 119 },
      { name: "Network security and threats", textbookStart: 126 },
      { name: "HTML and CSS", textbookStart: 130 },
      { name: "Web forms and JavaScript", textbookStart: 136 },
      { name: "Search engine indexing", textbookStart: 142 },
      { name: "Client-server and peer-to-peer", textbookStart: 147 },
    ],
  },
  {
    id: 6,
    name: "Data Types",
    paper: 1,
    topics: [
      { name: "Primitive data types, binary, and hexadecimal", textbookStart: 155 },
      { name: "ASCII and Unicode", textbookStart: 159 },
      { name: "Binary arithmetic", textbookStart: 162 },
      { name: "Floating point arithmetic", textbookStart: 167 },
      { name: "Bitwise manipulation and masks", textbookStart: 174 },
    ],
  },
  {
    id: 7,
    name: "Data Structures",
    paper: 1,
    topics: [
      { name: "Arrays, tuples, and records", textbookStart: 179 },
      { name: "Queues", textbookStart: 184 },
      { name: "Lists and linked lists", textbookStart: 190 },
      { name: "Stacks", textbookStart: 200 },
      { name: "Hash tables", textbookStart: 204 },
      { name: "Graphs", textbookStart: 209 },
      { name: "Trees", textbookStart: 214 },
    ],
  },
  {
    id: 8,
    name: "Boolean Algebra",
    paper: 1,
    topics: [
      { name: "Logic gates and truth tables", textbookStart: 223 },
      { name: "Simplifying boolean expressions", textbookStart: 228 },
      { name: "Karnaugh maps", textbookStart: 233 },
      { name: "Adders and D-type flip-flops", textbookStart: 238 },
    ],
  },
  {
    id: 9,
    name: "Legal, moral, ethical and cultural issues",
    paper: 1,
    topics: [
      { name: "Computing-related legislation", textbookStart: 243 },
      { name: "Ethical, moral and cultural issues", textbookStart: 249 },
      { name: "Privacy and censorship", textbookStart: 255 },
    ],
  },

  // PAPER 2
  {
    id: 10,
    name: "Computational thinking",
    paper: 2,
    topics: [
      { name: "Thinking abstractly", textbookStart: 260 },
      { name: "Thinking ahead", textbookStart: 265 },
      { name: "Thinking procedurally", textbookStart: 268 },
      { name: "Thinking logically, Thinking concurrently", textbookStart: 272 },
      { name: "Problem recognition", textbookStart: 277 },
      { name: "Problem solving", textbookStart: 282 },
    ],
  },
  {
    id: 11,
    name: "Programming Techniques",
    paper: 2,
    topics: [
      { name: "Programming basics", textbookStart: 288 },
      { name: "Selection", textbookStart: 294 },
      { name: "Iteration", textbookStart: 299 },
      { name: "Subroutines and recursion", textbookStart: 303 },
      { name: "Use of an IDE", textbookStart: 313 },
      { name: "Use of object-oriented techniques", textbookStart: 319 },
    ],
  },
  {
    id: 12,
    name: "Algorithms",
    paper: 2,
    topics: [
      { name: "Analysis and design of algorithms", textbookStart: 328 },
      { name: "Searching algorithms", textbookStart: 334 },
      { name: "Bubble sort and insertion sort", textbookStart: 340 },
      { name: "Merge sort and quick sort", textbookStart: 345 },
      { name: "Graph traversal algorithms", textbookStart: 351 },
      { name: "Optimisation algorithms", textbookStart: 358 },
    ],
  },
];

// ---- normalize slugs + auto textbookEnd
sections.forEach((section) => {
  section.sectionSlug = slugify(section.name);

  // ensure object format
  section.topics = section.topics.map((t) => {
    if (typeof t === "string") return { name: t };
    return { ...t };
  });

  // topicSlug
  section.topics = section.topics.map((t) => ({
    ...t,
    topicSlug: t.topicSlug || slugify(t.name),
  }));

  // auto textbookEnd if textbookStart exists
  for (let i = 0; i < section.topics.length; i++) {
    const cur = section.topics[i];
    if (typeof cur.textbookStart !== "number") continue;

    // next topic that has a textbookStart
    let nextStart = null;
    for (let j = i + 1; j < section.topics.length; j++) {
      const nxt = section.topics[j];
      if (typeof nxt.textbookStart === "number") {
        nextStart = nxt.textbookStart;
        break;
      }
    }

    // If we know next start, end is previous page. If not, default to start+3 (you can edit later)
    cur.textbookEnd =
      typeof nextStart === "number" ? nextStart - 1 : cur.textbookStart + 3;
  }
});

export default sections;
