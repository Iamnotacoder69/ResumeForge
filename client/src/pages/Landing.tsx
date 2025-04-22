import CVUploader from "@/components/cv/CVUploader";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-xl font-bold text-primary">CV Builder</h1>
        </div>
      </header>
      
      <main className="flex-grow">
        <CVUploader />
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CV Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}