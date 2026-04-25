import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Level } from "@/lib/api/curriculum-client";

// Register fonts (optional, using standard Helvetica for now to keep it simple,
// or could register Inter if we had the font files locally/url)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  termInfo: {
    fontSize: 10,
    color: "#64748b", // slate-500
    textAlign: "right",
  },
  studentSection: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  studentName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a", // slate-900
    marginBottom: 4,
  },
  levelName: {
    fontSize: 14,
    color: "#1c82c5",
    fontFamily: "Helvetica-Bold",
  },
  skillsSection: {
    marginTop: 10,
  },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9", // slate-100
    minHeight: 40,
  },
  skillDescriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#334155",
    marginRight: 8,
  },
  skillText: {
    fontSize: 11,
    color: "#334155", // slate-700
  },
  gradeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  gradeBadge: {
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    textTransform: "uppercase",
  },
  // Grade specific styles
  not_started: {
    backgroundColor: "#fee2e2", // red-100
    color: "#dc2626", // red-600
  },
  developing: {
    backgroundColor: "#fef9c3", // yellow-100
    color: "#ca8a04", // yellow-600
  },
  mastered: {
    backgroundColor: "#dcfce7", // green-100
    color: "#16a34a", // green-600
  },
  commentsSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f8fafc", // slate-50
    borderRadius: 8,
  },
  commentsTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#475569", // slate-600
    marginBottom: 8,
  },
  commentsText: {
    fontSize: 11,
    color: "#334155", // slate-700
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8", // slate-400
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

interface ReportCardPdfProps {
  studentName: string;
  level: Level;
  skillGrades: Record<string, "not_started" | "developing" | "mastered">;
  comments: string;
  termName: string;
  instructorName: string;
}

const formatGrade = (grade: "not_started" | "developing" | "mastered") => {
  switch (grade) {
    case "not_started":
      return "Not Started";
    case "developing":
      return "Developing";
    case "mastered":
      return "Mastered";
    default:
      return grade;
  }
};

export const ReportCardPdf = ({
  studentName,
  level,
  skillGrades,
  comments,
  termName,
  instructorName,
}: ReportCardPdfProps) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Safe fallback for logo
  const logoUrl = "/swanSwimLogo.png";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 20,
                  color: "#0f172a",
                }}
              >
                Swan Swim School
              </Text>
              <Text style={{ fontSize: 10, color: "#64748b" }}>
                Progress Report
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.termInfo}>{termName}</Text>
            <Text style={styles.termInfo}>Generated: {currentDate}</Text>
          </View>
        </View>

        {/* Student Info - Simplified Design */}
        <View style={styles.studentSection}>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.levelName}>{level.name}</Text>
        </View>

        {/* Horizontal Line */}
        <View
          style={{
            height: 1,
            backgroundColor: "#e2e8f0",
            marginBottom: 20,
            marginHorizontal: 10,
          }}
        />

        {/* Skills List */}
        <View style={styles.skillsSection}>
          {level.skills.map((skill) => {
            const grade = skillGrades[skill.id] || "not_started";
            return (
              <View key={skill.id} style={styles.skillRow}>
                <View style={styles.skillDescriptionContainer}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.skillText}>{skill.description}</Text>
                </View>
                <View
                  style={[
                    styles.gradeBadge,
                    grade === "not_started"
                      ? styles.not_started
                      : grade === "developing"
                        ? styles.developing
                        : styles.mastered,
                  ]}
                >
                  <Text style={{ fontSize: 10 }}>{formatGrade(grade)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Comments */}
        {comments && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Instructor Comments</Text>
            <Text style={styles.commentsText}>{comments}</Text>
            <Text
              style={[
                styles.commentsText,
                { marginTop: 10, fontStyle: "italic", fontSize: 10 },
              ]}
            >
              - {instructorName}
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Swan Swim School • {termName} • {studentName}
        </Text>
      </Page>
    </Document>
  );
};
