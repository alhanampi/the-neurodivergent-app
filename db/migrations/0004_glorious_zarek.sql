ALTER TABLE "timer_sessions" ADD COLUMN "task_id" integer;--> statement-breakpoint
ALTER TABLE "timer_sessions" ADD COLUMN "subtask_id" integer;--> statement-breakpoint
ALTER TABLE "timer_sessions" ADD COLUMN "task_label" text;--> statement-breakpoint
ALTER TABLE "timer_sessions" ADD CONSTRAINT "timer_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timer_sessions" ADD CONSTRAINT "timer_sessions_subtask_id_subtasks_id_fk" FOREIGN KEY ("subtask_id") REFERENCES "public"."subtasks"("id") ON DELETE set null ON UPDATE no action;