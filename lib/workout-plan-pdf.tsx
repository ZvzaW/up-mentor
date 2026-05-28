import * as React from "react"
import path from "path"
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer"

export type WorkoutPlanPdfData = {
  name: string
  difficulty: string | null
  description: string | null
  section: Array<{
    body_part: string | null
    order: number
    exercise_set: Array<{
      order: number
      series_count: number
      reps_count: number
      weight: number | null
      exercise: {
        name: string
      }
    }>
  }>
}

Font.register({
  family: "DejaVu Sans",
  fonts: [
    {
      src: path.join(
        process.cwd(),
        "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"
      ),
      fontWeight: "normal",
    },
    {
      src: path.join(
        process.cwd(),
        "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"
      ),
      fontWeight: "bold",
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 11,
    fontFamily: "DejaVu Sans",
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 10,
    color: "#555",
    marginBottom: 10,
  },
  description: {
    marginBottom: 14,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: 700,
  },
  exerciseLine: {
    marginBottom: 4,
    lineHeight: 1.35,
  },
})

function WorkoutPlanPdfDocument({ plan }: { plan: WorkoutPlanPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{plan.name}</Text>
        <Text style={styles.subtitle}>
          Poziom: {plan.difficulty || "Nie określono"}
        </Text>

        {plan.description ? (
          <Text style={styles.description}>{plan.description}</Text>
        ) : null}

        {plan.section.map((section, sectionIndex) => (
          <View key={`${section.order}-${sectionIndex}`} style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sekcja {sectionIndex + 1}
              {section.body_part ? ` - ${section.body_part}` : ""}
            </Text>

            {section.exercise_set.map((set, setIndex) => (
              <Text key={`${set.order}-${setIndex}`} style={styles.exerciseLine}>
                {setIndex + 1}. {set.exercise.name} | Serie: {set.series_count} |
                Powtórzenia: {set.reps_count}
                {set.weight != null ? ` | Ciężar: ${set.weight} kg` : ""}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}

export async function renderWorkoutPlanPdfBuffer(plan: WorkoutPlanPdfData) {
  return renderToBuffer(<WorkoutPlanPdfDocument plan={plan} />)
}
