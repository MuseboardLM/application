// app/dashboard/page.tsx

export default function MuseboardPage() {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to Your Museboard
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            This is your private application area.
          </p>
          {/* All your main application components will go here */}
        </div>
      </div>
    );
  }