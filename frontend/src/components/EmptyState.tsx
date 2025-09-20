import { Upload } from "lucide-react"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"

export function EmptyState() {
  const navigate = useNavigate()

  return (
    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Upload className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No documents analyzed</h3>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">
          Upload a document to see the analysis here.
        </p>
        <Button onClick={() => navigate("/upload")}>Upload Document</Button>
      </div>
    </div>
  )
}
