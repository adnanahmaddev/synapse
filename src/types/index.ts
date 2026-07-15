export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  concept: string;
  content: string;
  componentType: 'quiz';
  quizData: QuizData;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Syllabus {
  title: string;
  description: string;
  modules: Module[];
}

export interface Course {
  id: string;
  title: string;
  prompt: string;
  syllabus: Syllabus;
  completedLessons: string[];
  createdAt: string;
}

export interface ModelConfig {
  provider: 'gemini' | 'ollama';
  apiKey: string;
  host: string;
  model: string;
}
