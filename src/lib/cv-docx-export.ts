import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

interface WorkEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface SkillGroup {
  category: string;
  skills: string;
}

interface RefereeEntry {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

interface ProjectEntry {
  name: string;
  link: string;
  technologies: string;
  bullets: string[];
}

interface CvData {
  fullName: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  experience: WorkEntry[];
  education: EducationEntry[];
  skillGroups: SkillGroup[];
  projects?: ProjectEntry[];
  referees: RefereeEntry[];
  referencesUponRequest: boolean;
}

function formatDateRange(start: string, end: string, current: boolean): string {
  const fmt = (d: string) => {
    if (!d) return "";
    const [y, m] = d.split("-");
    if (!m) return y;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  };
  const s = fmt(start);
  const e = current ? "Present" : fmt(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "1B3A5C", space: 4 },
    },
    run: {
      bold: true,
      color: "1B3A5C",
      size: 22,
      font: "Calibri",
    },
  });
}

function contactLine(data: CvData): string {
  const parts: string[] = [];
  if (data.email) parts.push(data.email);
  if (data.phone) parts.push(data.phone);
  if (data.location) parts.push(data.location);
  if (data.linkedin) parts.push(data.linkedin);
  return parts.join("  |  ");
}

export async function downloadCvDocx(data: CvData): Promise<void> {
  const children: Paragraph[] = [];

  // Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: data.fullName || "Your Name",
          bold: true,
          size: 36,
          font: "Calibri",
          color: "1B3A5C",
        }),
      ],
    })
  );

  // Tagline
  if (data.tagline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: data.tagline,
            size: 22,
            font: "Calibri",
            color: "555555",
            italics: true,
          }),
        ],
      })
    );
  }

  // Contact line
  const contact = contactLine(data);
  if (contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: contact,
            size: 18,
            font: "Calibri",
            color: "333333",
          }),
        ],
      })
    );
  }

  // Professional Summary
  if (data.summary?.trim()) {
    children.push(sectionHeading("Professional Summary"));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: data.summary.trim(),
            size: 20,
            font: "Calibri",
          }),
        ],
      })
    );
  }

  // Work Experience
  const hasExp = data.experience?.some((e) => e.company || e.role);
  if (hasExp) {
    children.push(sectionHeading("Professional Experience"));
    for (const exp of data.experience) {
      if (!exp.company && !exp.role) continue;
      const dateRange = formatDateRange(exp.startDate, exp.endDate, exp.current);

      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: exp.role || "", bold: true, size: 22, font: "Calibri" }),
            ...(exp.company
              ? [new TextRun({ text: `  |  ${exp.company}`, size: 22, font: "Calibri", color: "444444" })]
              : []),
            ...(dateRange
              ? [new TextRun({ text: `  |  ${dateRange}`, size: 20, font: "Calibri", color: "777777" })]
              : []),
          ],
        })
      );

      for (const bullet of exp.bullets.filter((b) => b.trim())) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: bullet.trim(), size: 20, font: "Calibri" })],
          })
        );
      }
    }
  }

  // Education
  const hasEdu = data.education?.some((e) => e.institution || e.degree);
  if (hasEdu) {
    children.push(sectionHeading("Education"));
    for (const edu of data.education) {
      if (!edu.institution && !edu.degree) continue;
      const dateRange = formatDateRange(edu.startDate, edu.endDate, false);
      const degreeText = [edu.degree, edu.field].filter(Boolean).join(", ");

      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ text: edu.institution || "", bold: true, size: 22, font: "Calibri" }),
            ...(dateRange
              ? [new TextRun({ text: `  |  ${dateRange}`, size: 20, font: "Calibri", color: "777777" })]
              : []),
          ],
        })
      );

      if (degreeText) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: degreeText, size: 20, font: "Calibri", italics: true, color: "444444" })],
          })
        );
      }
    }
  }

  // Skills
  const hasSkills = data.skillGroups?.some((g) => g.category && g.skills);
  if (hasSkills) {
    children.push(sectionHeading("Skills"));
    for (const group of data.skillGroups) {
      if (!group.category || !group.skills) continue;
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: `${group.category}: `, bold: true, size: 20, font: "Calibri" }),
            new TextRun({ text: group.skills, size: 20, font: "Calibri" }),
          ],
        })
      );
    }
  }

  // Projects
  const hasProjects = data.projects?.some((p) => p.name);
  if (hasProjects) {
    children.push(sectionHeading("Projects"));
    for (const proj of data.projects ?? []) {
      if (!proj.name) continue;
      const metaParts = [proj.link, proj.technologies].filter(Boolean).join("  |  ");

      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: proj.name, bold: true, size: 22, font: "Calibri" }),
          ],
        })
      );

      if (metaParts) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: metaParts, size: 18, font: "Calibri", color: "777777" })],
          })
        );
      }

      for (const bullet of proj.bullets.filter((b) => b.trim())) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: bullet.trim(), size: 20, font: "Calibri" })],
          })
        );
      }
    }
  }

  // References
  const hasRefs = data.referees?.some((r) => r.name);
  if (data.referencesUponRequest || hasRefs) {
    children.push(sectionHeading("References"));

    if (data.referencesUponRequest && !hasRefs) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "Available upon request.", size: 20, font: "Calibri", italics: true })],
        })
      );
    } else {
      for (const ref of data.referees.filter((r) => r.name)) {
        const refLine = [ref.title, ref.company].filter(Boolean).join(", ");
        const contactParts = [ref.email, ref.phone].filter(Boolean).join("  |  ");
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            children: [new TextRun({ text: ref.name, bold: true, size: 20, font: "Calibri" })],
          })
        );
        if (refLine) children.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: refLine, size: 20, font: "Calibri", color: "555555" })] }));
        if (contactParts) children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: contactParts, size: 18, font: "Calibri", color: "777777" })] }));
      }
    }
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 22, color: "1B3A5C", font: { name: "Calibri" } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = data.fullName ? `${data.fullName.replace(/\s+/g, "_")}_CV.docx` : "CV.docx";
  saveAs(blob, fileName);
}
