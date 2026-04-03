/**
 * ATS-Friendly Resume Generator
 * Generates clean, ATS-compliant resume from structured JSON data
 */

const generateProfessionalSummary = (skills, projects, experience) => {
  const skillsStr = skills?.technical?.slice(0, 3).join(", ") || "";
  const hasExperience = experience && experience.length > 0;
  const hasProjects = projects && projects.length > 0;

  if (hasExperience) {
    return `Results-driven professional with expertise in ${skillsStr}. Proven track record of delivering impactful solutions and driving continuous improvement in technical projects.`;
  } else if (hasProjects) {
    return `Motivated student developer with hands-on experience in ${skillsStr}. Passionate about building scalable applications and contributing to innovative projects.`;
  }
  return `Dedicated professional with strong foundation in ${skillsStr}. Committed to leveraging technical skills and continuous learning to solve complex problems.`;
};

const formatBulletPoint = (text) => {
  if (!text) return "";
  const actionVerbs = [
    "Built",
    "Developed",
    "Designed",
    "Implemented",
    "Created",
    "Led",
    "Managed",
    "Optimized",
    "Improved",
    "Established",
    "Deployed",
  ];
  const startsWithVerb = actionVerbs.some((verb) =>
    text.trim().startsWith(verb)
  );

  if (startsWithVerb) {
    return text.trim();
  }

  const firstWord = text.trim().split(" ")[0];
  if (
    firstWord.length > 0 &&
    firstWord[0] === firstWord[0].toLowerCase()
  ) {
    return `Developed ${text.trim()}`;
  }

  return text.trim();
};

const cleanSkills = (skills) => {
  if (!skills) return [];
  const allSkills = [...new Set(skills.map((s) => s.trim().toLowerCase()))];
  return allSkills.filter((s) => s.length > 0);
};

export const generateATSResume = (data) => {
  if (!data || !data.personalInfo) {
    return "Error: Missing personal information";
  }

  const {
    personalInfo,
    education,
    skills,
    projects,
    experience,
    certifications,
    achievements,
  } = data;

  let resume = "";

  // Header Section
  resume += `${personalInfo.name || "Your Name"}\n`;
  const contactInfo = [];
  if (personalInfo.email) contactInfo.push(personalInfo.email);
  if (personalInfo.phone) contactInfo.push(personalInfo.phone);
  if (personalInfo.linkedin) contactInfo.push(`LinkedIn: ${personalInfo.linkedin}`);
  if (personalInfo.github) contactInfo.push(`GitHub: ${personalInfo.github}`);

  if (contactInfo.length > 0) {
    resume += `${contactInfo.join(" | ")}\n`;
  }
  resume += "\n";

  // Professional Summary
  const summary = generateProfessionalSummary(skills, projects, experience);
  resume += `PROFESSIONAL SUMMARY\n`;
  resume += `${summary}\n\n`;

  // Skills Section
  if (skills && (skills.technical?.length > 0 || skills.soft?.length > 0)) {
    resume += `SKILLS\n`;
    if (skills.technical && skills.technical.length > 0) {
      const cleanTechnical = cleanSkills(skills.technical);
      resume += `Technical: ${cleanTechnical.join(", ")}\n`;
    }
    if (skills.soft && skills.soft.length > 0) {
      const cleanSoft = cleanSkills(skills.soft);
      resume += `Soft Skills: ${cleanSoft.join(", ")}\n`;
    }
    resume += "\n";
  }

  // Education Section
  if (education && education.length > 0) {
    resume += `EDUCATION\n`;
    education.forEach((edu) => {
      if (edu.degree || edu.institution) {
        const degreeStr = edu.degree || "Degree";
        const instStr = edu.institution || "Institution";
        const yearStr = edu.year ? ` - ${edu.year}` : "";
        const gpaStr = edu.gpa ? ` (GPA: ${edu.gpa})` : "";
        resume += `${degreeStr}, ${instStr}${yearStr}${gpaStr}\n`;
      }
    });
    resume += "\n";
  }

  // Experience Section
  if (experience && experience.length > 0) {
    resume += `EXPERIENCE\n`;
    experience.forEach((exp) => {
      if (exp.role || exp.company) {
        const roleStr = exp.role || "Position";
        const companyStr = exp.company || "Company";
        const durationStr = exp.duration ? ` (${exp.duration})` : "";
        resume += `${roleStr} - ${companyStr}${durationStr}\n`;

        if (exp.description) {
          const descriptions = Array.isArray(exp.description)
            ? exp.description
            : [exp.description];
          descriptions.forEach((desc) => {
            const formatted = formatBulletPoint(desc);
            if (formatted) {
              resume += `- ${formatted}\n`;
            }
          });
        }
      }
    });
    resume += "\n";
  }

  // Projects Section
  if (projects && projects.length > 0) {
    resume += `PROJECTS\n`;
    projects.forEach((project) => {
      if (project.title) {
        resume += `${project.title}\n`;

        if (project.description) {
          const formatted = formatBulletPoint(project.description);
          resume += `- ${formatted}\n`;
        }

        if (project.technologies && project.technologies.length > 0) {
          resume += `- Technologies: ${project.technologies.join(", ")}\n`;
        }

        if (project.link) {
          resume += `- Link: ${project.link}\n`;
        }
      }
    });
    resume += "\n";
  }

  // Certifications Section
  if (certifications && certifications.length > 0) {
    resume += `CERTIFICATIONS\n`;
    certifications.forEach((cert) => {
      if (cert) {
        resume += `- ${cert}\n`;
      }
    });
    resume += "\n";
  }

  // Achievements Section
  if (achievements && achievements.length > 0) {
    resume += `ACHIEVEMENTS\n`;
    achievements.forEach((achievement) => {
      if (achievement) {
        resume += `- ${achievement}\n`;
      }
    });
    resume += "\n";
  }

  return resume.trim();
};

export const downloadResume = (resumeContent, fileName = "resume.txt") => {
  const element = document.createElement("a");
  const file = new Blob([resumeContent], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};
