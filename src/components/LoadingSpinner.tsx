export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-lg text-muted-foreground">
        Fetching and verifying information...
      </p>
    </div>
  );
};
