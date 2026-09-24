export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ExtractionStatus = "pending" | "processing" | "done" | "failed";
export type TopicDifficulty = "easy" | "medium" | "hard";
export type TopicStatus = "pending" | "in_progress" | "done";
export type StudyDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type QuizQuestionType = "mcq" | "short_answer";
export type QuizType = "topic" | "mock";
export type CalendarEventType = "study" | "revision" | "practice" | "exam" | "other" | "break";
export type ThemePreference = "light" | "dark" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          college_name: string | null;
          daily_study_minutes: number;
          study_days: string[];
          preferred_study_time: string;
          study_reminders_enabled: boolean;
          exam_reminders_enabled: boolean;
          app_lock_enabled: boolean;
          theme_preference: ThemePreference;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          college_name?: string | null;
          daily_study_minutes?: number;
          study_days?: string[];
          preferred_study_time?: string;
          study_reminders_enabled?: boolean;
          exam_reminders_enabled?: boolean;
          app_lock_enabled?: boolean;
          theme_preference?: ThemePreference;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          college_name?: string | null;
          daily_study_minutes?: number;
          study_days?: string[];
          preferred_study_time?: string;
          study_reminders_enabled?: boolean;
          exam_reminders_enabled?: boolean;
          app_lock_enabled?: boolean;
          theme_preference?: ThemePreference;
          created_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          exam_date: string | null;
          syllabus_file_url: string | null;
          extraction_status: ExtractionStatus;
          extraction_error: string | null;
          extraction_warning: string | null;
          slot_start_time: string | null;
          slot_end_time: string | null;
          slot_days: string[] | null;
          break_enabled: boolean;
          break_minutes: number | null;
          break_frequency: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          exam_date?: string | null;
          syllabus_file_url?: string | null;
          extraction_status?: ExtractionStatus;
          extraction_error?: string | null;
          extraction_warning?: string | null;
          slot_start_time?: string | null;
          slot_end_time?: string | null;
          slot_days?: string[] | null;
          break_enabled?: boolean;
          break_minutes?: number | null;
          break_frequency?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          exam_date?: string | null;
          syllabus_file_url?: string | null;
          extraction_status?: ExtractionStatus;
          extraction_error?: string | null;
          extraction_warning?: string | null;
          slot_start_time?: string | null;
          slot_end_time?: string | null;
          slot_days?: string[] | null;
          break_enabled?: boolean;
          break_minutes?: number | null;
          break_frequency?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          subject_id: string;
          slug: string;
          unit_no: number | null;
          unit_title: string | null;
          title: string;
          subtopics: string[] | null;
          difficulty: TopicDifficulty;
          status: TopicStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          slug: string;
          unit_no?: number | null;
          unit_title?: string | null;
          title: string;
          subtopics?: string[] | null;
          difficulty?: TopicDifficulty;
          status?: TopicStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          slug?: string;
          unit_no?: number | null;
          unit_title?: string | null;
          title?: string;
          subtopics?: string[] | null;
          difficulty?: TopicDifficulty;
          status?: TopicStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      study_plans: {
        Row: {
          id: string;
          subject_id: string;
          topic_id: string;
          scheduled_date: string;
          planned_minutes: number;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          topic_id: string;
          scheduled_date: string;
          planned_minutes?: number;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          topic_id?: string;
          scheduled_date?: string;
          planned_minutes?: number;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_plans_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_plans_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          started_at: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_notes: {
        Row: {
          id: string;
          topic_id: string;
          content: string;
          summary: string | null;
          key_points: string[] | null;
          examples: string | null;
          qa: Json | null;
          textbook_references: string[] | null;
          is_saved: boolean;
          generated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          content: string;
          summary?: string | null;
          key_points?: string[] | null;
          examples?: string | null;
          qa?: Json | null;
          textbook_references?: string[] | null;
          is_saved?: boolean;
          generated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          content?: string;
          summary?: string | null;
          key_points?: string[] | null;
          examples?: string | null;
          qa?: Json | null;
          textbook_references?: string[] | null;
          is_saved?: boolean;
          generated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_notes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: {
          id: string;
          topic_id: string | null;
          subject_id: string | null;
          quiz_type: QuizType;
          title: string;
          difficulty: TopicDifficulty | null;
          time_limit_minutes: number | null;
          question_count: number;
          generated_at: string;
        };
        Insert: {
          id?: string;
          topic_id?: string | null;
          subject_id?: string | null;
          quiz_type?: QuizType;
          title: string;
          difficulty?: TopicDifficulty | null;
          time_limit_minutes?: number | null;
          question_count?: number;
          generated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string | null;
          subject_id?: string | null;
          quiz_type?: QuizType;
          title?: string;
          difficulty?: TopicDifficulty | null;
          time_limit_minutes?: number | null;
          question_count?: number;
          generated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          topic_id: string | null;
          question: string;
          question_type: QuizQuestionType;
          options: string[] | null;
          correct_answer: string;
          explanation: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          topic_id?: string | null;
          question: string;
          question_type: QuizQuestionType;
          options?: string[] | null;
          correct_answer: string;
          explanation?: string | null;
          order_index: number;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          topic_id?: string | null;
          question?: string;
          question_type?: QuizQuestionType;
          options?: string[] | null;
          correct_answer?: string;
          explanation?: string | null;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_questions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          answers: Json;
          started_at: string;
          completed_at: string | null;
          is_completed: boolean;
          current_question_index: number;
          flagged_questions: Json;
          time_taken_seconds: number | null;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score?: number;
          total_questions: number;
          answers?: Json;
          started_at?: string;
          completed_at?: string | null;
          is_completed?: boolean;
          current_question_index?: number;
          flagged_questions?: Json;
          time_taken_seconds?: number | null;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          score?: number;
          total_questions?: number;
          answers?: Json;
          started_at?: string;
          completed_at?: string | null;
          is_completed?: boolean;
          current_question_index?: number;
          flagged_questions?: Json;
          time_taken_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          topic_id: string | null;
          title: string;
          event_type: CalendarEventType;
          difficulty: TopicDifficulty | null;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          status: TopicStatus;
          notes: string | null;
          google_event_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          topic_id?: string | null;
          title: string;
          event_type?: CalendarEventType;
          difficulty?: TopicDifficulty | null;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          status?: TopicStatus;
          notes?: string | null;
          google_event_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string | null;
          topic_id?: string | null;
          title?: string;
          event_type?: CalendarEventType;
          difficulty?: TopicDifficulty | null;
          scheduled_date?: string;
          start_time?: string;
          end_time?: string;
          status?: TopicStatus;
          notes?: string | null;
          google_event_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_events_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type StudyPlanEntry = Database["public"]["Tables"]["study_plans"]["Row"];
export type StudySession = Database["public"]["Tables"]["study_sessions"]["Row"];
export type TopicNote = Database["public"]["Tables"]["topic_notes"]["Row"];
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
export type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
export type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];
