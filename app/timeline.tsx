"use client";

import { useState } from "react";

interface Term {
  period: string;
  classes?: string[];
  work?: string[];
  extra?: string[];
}

interface Section {
  title: string;
  terms: Term[];
}

const timeline: Section[] = [
  {
    title: "Currently Building Businesses!",
    terms: [],
  },
  {
    title: "Spring 23-24",
    terms: [
      {
        period: "Classes",
        classes: [
          "DESIGN 161B Advanced Design Capstone 1B",
          "BIO 150 Human Behavioral Biology",
          "ARTSTUDI 152 Soft Sculpture",
          "CS 247G Game Design",
        ],
      },
    ],
  },
  {
    title: "Winter 23-24",
    terms: [
      {
        period: "Classes",
        classes: [
          "DESIGN 101 History and Ethics of Design",
          "DESIGN 161A Advanced Design Capstone 1A",
          "ENERGY 203 Stanford Climate Ventures",
          "CME 106 Probability and Statistics",
          "CS 205L Continuous Mathematical Methods with Emphasis on Machine Learning",
        ],
      },
    ],
  },
  {
    title: "Fall 23-24",
    terms: [
      {
        period: "Classes",
        classes: [
          "ME 325 Injection Molding",
          "ME 303 Soft Robotics",
          "ME 219 Magic of Materials and Manufacturing",
          "ME 217 Engineering Design Analytics",
          "DESIGN 231 Needfinding",
        ],
      },
    ],
  },
  {
    title: "Summer 22-23",
    terms: [{ period: "Work", work: ["Product Design Intern @ Apple"] }],
  },
  {
    title: "Spring 22-23",
    terms: [
      {
        period: "Study Abroad — Berlin, Germany",
        classes: [
          "MOSPBER 2Z Accelerated German",
          "OSPBER 33B Discovering German Culture through Engineering",
          "OSPBER 30 Berlin vor Ort: Field Trip",
          "PATH 51 Anatomy",
        ],
      },
    ],
  },
  {
    title: "Winter 22-23",
    terms: [
      {
        period: "Classes",
        classes: [
          "ME 318 Computer-Aided Product Creation",
          "MUSIC 101 Electronic Music",
          "ME 115B Product Design Methods",
          "ME 104 Intro to Mechanical Systems",
          "GLOBAL 104 Iranian Cuisine",
          "ME 228 The Future of Mechanical Engineering",
          "ENGR 311A Women\u2019s Perspectives in Engineering",
        ],
      },
    ],
  },
  {
    title: "Fall 22-23",
    terms: [
      {
        period: "Classes",
        classes: [
          "ME 103 Designing and Making",
          "ME 115A Intro to Human Values in Design",
          "ARTSTUDI 151 Sculpture",
          "ME 391 Engineering Problems and Experimental Investigation",
          "MUSIC 31B Music and Healing",
        ],
      },
    ],
  },
  {
    title: "Summer 21-22",
    terms: [{ period: "Work", work: ["Product Design Intern @ Apple"] }],
  },
  {
    title: "Spring 20-21",
    terms: [
      {
        period: "Work",
        work: [
          "Mechanical Engineering Intern @ Swope Design Solutions",
          "Website Designer @ Engineers for a Sustainable World",
          "Merch Designer @ Engineers for a Sustainable World",
        ],
      },
    ],
  },
  {
    title: "Winter 20-21",
    terms: [
      {
        period: "Classes",
        classes: [
          "ARTSTUDI 173A Intro Photography: Blue",
          "HUMBIO 174 Foundations of Bioethics",
          "ME 80 Mechanics of Materials",
          "ME 341 Design Experiments",
          "MUSIC 1A Music, Mind, and Human Behavior",
          "PWR 2AB Makers, Crafters, Hackers: The Rhetoric of DIY",
        ],
      },
      {
        period: "Work",
        work: [
          "Research Assistant @ Stanford Graduate School of Education",
          "Mentor @ FIRST Robotics",
          "Website Designer @ Engineers for a Sustainable World",
        ],
        extra: [
          "Stanford Arts Grant recipient: \u201cQueer & Asian Zine\u201d \u2014 a digital archive of stories, identities, and feelings.",
        ],
      },
    ],
  },
  {
    title: "Fall 20-21",
    terms: [
      {
        period: "Classes",
        classes: [
          "ENGR 14 Intro to Solid Mechanics",
          "ME 102 Foundations of Product Realization",
          "ME 191 Engineering Problems and Experimental Investigation",
          "MUSIC 154E Creative Agency in the Pandemic World",
          "PHYSICS 41 Mechanics",
          "PSYCH 70 Intro to Social Psychology",
        ],
      },
      {
        period: "Work",
        work: [
          "Transcriber @ Stanford Department of Music",
          "Quality Control Technician @ Resonetics Micro Manufacturing",
          "Instructor and Curriculum Designer @ Introduction to Crochet Construction and Textile",
        ],
      },
    ],
  },
  {
    title: "Summer 19-20",
    terms: [
      {
        period: "Classes",
        classes: ["GERLANG 5 Intensive First-Year German"],
      },
      {
        period: "Work",
        work: [
          "Transcriber @ Stanford Department of Music",
          "Audio Engineer Intern @ Cress Health",
          "3D Printing Research Intern @ Van Dyk Recycling Solutions",
        ],
      },
    ],
  },
  {
    title: "Spring 19-20",
    terms: [
      {
        period: "Classes",
        classes: [
          "EDUC 190 Directed Research in Education",
          "ENGR 40M Intro to Making: What is EE",
          "ITALIC 95W Immersion in the Arts: Writing",
          "MATH 51 Linear Algebra, Multivariable Calculus, and Modern Applications",
          "STATS 60 Introduction to Statistical Methods",
          "MUSIC 275C Advanced Clarinet",
        ],
      },
      {
        period: "Work",
        work: [
          "Transcriber @ Stanford Department of Music",
          "Friends of Music Applied Music Scholarship Program",
          "Research Assistant @ Stanford Graduate School of Education",
        ],
        extra: [
          "Stanford Arts Grant recipient: \u201cLove in the time of COVID19\u201d \u2014 Podcast Project",
        ],
      },
    ],
  },
  {
    title: "Winter 19-20",
    terms: [
      {
        period: "Classes",
        classes: [
          "CS 106A Programming Methodology",
          "ITALIC 92 Immersion in the Arts: Interpreting",
          "ME 101 Visual Thinking",
          "ME 110 Design Sketching",
          "MUSIC 160 Stanford Symphony Orchestra",
          "MUSIC 275C Advanced Clarinet",
        ],
      },
      {
        period: "Work",
        work: [
          "Transcriber @ Stanford Department of Music",
          "Friends of Music Applied Music Scholarship Program",
        ],
        extra: [
          "Makeathon: Make it Green (Economic, Social & Environmental Sustainability and Design) \u2014 Most Impactful Project",
        ],
      },
    ],
  },
  {
    title: "Fall 19-20",
    terms: [
      {
        period: "Classes",
        classes: [
          "PSYCH 1 Introduction to Psychology",
          "ITALIC 91 Immersion in the Arts: Creating",
          "ME 195A Food, Design & Technology",
          "MUSIC 160 Stanford Symphony Orchestra",
          "MUSIC 275C Advanced Clarinet",
          "WELLNESS 150 Introduction to Nutrition",
        ],
      },
      {
        period: "Work",
        work: [
          "Transcriber @ Stanford Department of Music",
          "Friends of Music Applied Music Scholarship Program",
        ],
      },
    ],
  },
];

export default function Timeline() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="btn-glossy w-full py-3 text-center font-extrabold text-[#8a6080] text-sm tracking-wide"
      >
        {open ? "hide" : "show"} what i&apos;ve been up to...
      </button>

      {open && (
        <div className="mt-4 space-y-4 animate-fade-up">
          <p className="text-[12px] text-[#b8a0b0] italic">
            i always want to know people&apos;s histories — so here&apos;s some of mine!
          </p>

          {timeline.map((section) => (
            <div key={section.title}>
              <h3 className="font-pixel text-[13px] font-bold text-[#7a5a8a] mb-1.5">
                {section.title}
              </h3>
              {section.terms.map((term, i) => (
                <div key={i} className="mb-2 ml-3 border-l-2 border-[#e8d0e0] pl-3">
                  <p className="text-[11px] font-bold text-[#b080a0] mb-0.5">
                    {term.period}
                  </p>
                  {term.classes && (
                    <ul className="text-[11px] text-[#8a7a90] space-y-0.5">
                      {term.classes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                  {term.work && (
                    <ul className="text-[11px] text-[#7a6a80] space-y-0.5 mt-0.5">
                      {term.work.map((w) => (
                        <li key={w} className="font-medium">{w}</li>
                      ))}
                    </ul>
                  )}
                  {term.extra && (
                    <ul className="text-[11px] text-[#c0a8b8] italic space-y-0.5 mt-0.5">
                      {term.extra.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
