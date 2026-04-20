declare class Worker {
  constructor(scriptURL: string | URL, options?: WorkerOptions);
}

interface WorkerOptions {
  type?: "classic" | "module";
  name?: string;
}
