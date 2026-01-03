// src/pages/Home.js
import React from "react";
import TopicCard from "../components/TopicCard";

function Home() {
  const sections = [
    { title: "Components of a Computer", slug: "components-of-a-computer" },
    { title: "Systems Software", slug: "systems-software" },
    { title: "Software Development", slug: "software-development" },
    { title: "Exchanging Data", slug: "exchanging-data" },
    { title: "Networks and Web Technologies", slug: "networks-and-web-technologies" },
    { title: "Data Types", slug: "data-types" },
    { title: "Data Structures", slug: "data-structures" },
    { title: "Boolean Algebra", slug: "boolean-algebra" },
    { title: "Legal, Moral, Ethical & Cultural Issues", slug: "legal-moral-ethical-cultural-issues" },
    { title: "Computational Thinking", slug: "computational-thinking" },
    { title: "Programming Techniques", slug: "programming-techniques" },
    { title: "Algorithms", slug: "algorithms" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Computer Science Revision</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((s) => (
          <TopicCard
            key={s.slug}
            title={s.title}
            path={`/section/${s.slug}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
