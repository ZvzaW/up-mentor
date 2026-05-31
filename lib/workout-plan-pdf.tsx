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
import type { WorkoutPlanFromDb, WorkoutPlanItem } from "@/lib/types"

type WorkoutPlanPdfContent = Pick<
  WorkoutPlanItem,
  "name" | "difficulty" | "description" | "section"
>

export type PdfDownloadFile = {
  filename: string
  base64: string
}

export type PdfEmailAttachment = {
  filename: string
  content: Buffer
  contentType: "application/pdf"
}

function sanitizeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function pdfFilename(planName: string, index = 0) {
  const baseName = sanitizeFilename(planName) || `plan-treningowy-${index + 1}`
  return `${baseName}.pdf`
}

function normalizePlan(plan: WorkoutPlanFromDb): WorkoutPlanPdfContent {
  return {
    ...plan,
    section: plan.section.map((section) => ({
      ...section,
      exercise_set: section.exercise_set.map((set) => ({
        ...set,
        weight: set.weight == null ? null : Number(set.weight),
        exercise: {
          name: set.exercise.name,
          video_url: set.exercise.video_url ?? null,
        },
      })),
    })),
  }
}

async function renderPdfBuffer(plan: WorkoutPlanPdfContent) {
  return renderToBuffer(<PlanPdfDocument plan={plan} />)
}

async function buildPdf(plan: WorkoutPlanFromDb, index = 0) {
  const buffer = await renderPdfBuffer(normalizePlan(plan))
  return { buffer, filename: pdfFilename(plan.name, index) }
}

export async function toDownloadFile(
  plan: WorkoutPlanFromDb,
  index = 0
): Promise<PdfDownloadFile> {
  const { buffer, filename } = await buildPdf(plan, index)
  return { filename, base64: buffer.toString("base64") }
}

export async function toDownloadFiles(
  plans: WorkoutPlanFromDb[]
): Promise<PdfDownloadFile[]> {
  return Promise.all(plans.map((plan, index) => toDownloadFile(plan, index)))
}

async function toEmailAttachment(
  plan: WorkoutPlanFromDb,
  index = 0
): Promise<PdfEmailAttachment> {
  const { buffer, filename } = await buildPdf(plan, index)
  return { filename, content: buffer, contentType: "application/pdf" }
}

export async function toEmailAttachments(
  plans: WorkoutPlanFromDb[]
): Promise<PdfEmailAttachment[]> {
  return Promise.all(plans.map((plan, index) => toEmailAttachment(plan, index)))
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

function PlanPdfDocument({ plan }: { plan: WorkoutPlanPdfContent }) {
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
              <Text
                key={`${set.order}-${setIndex}`}
                style={styles.exerciseLine}
              >
                {setIndex + 1}. {set.exercise.name} | Serie: {set.series_count}{" "}
                | Powtórzenia: {set.reps_count}
                {set.weight != null ? ` | Ciężar: ${set.weight} kg` : ""}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}

export function downloadPdfFiles(files: PdfDownloadFile[]) {
  for (const file of files) {
    const binary = atob(file.base64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const blob = new Blob([bytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = file.filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }
}
