import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull().default(''),
  dateOfBirth: date('date_of_birth'),
  gender: text('gender'),
  bloodType: text('blood_type'),
  heightCm: numeric('height_cm'),
  weightKg: numeric('weight_kg'),
  emergencyContact: text('emergency_contact'),
  doctorContact: text('doctor_contact'),
  allergies: text('allergies'),
  conditions: text('conditions'),
  currentMedications: text('current_medications'),
  waterTargetMl: integer('water_target_ml').default(2500).notNull(),
  reminderPreferences: jsonb('reminder_preferences').$type<Record<string, unknown>>().default({}),
  demoSeeded: boolean('demo_seeded').default(false).notNull(),
  ...timestamps,
})

export const medications = pgTable('medications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  dosage: numeric('dosage').notNull(),
  unit: text('unit').notNull(),
  frequency: text('frequency').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  instructions: text('instructions'),
  foodInstruction: text('food_instruction'),
  prescribingDoctor: text('prescribing_doctor'),
  notes: text('notes'),
  status: text('status').default('active').notNull(),
  ...timestamps,
})

export const medicationSchedules = pgTable('medication_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  medicationId: uuid('medication_id').notNull().references(() => medications.id, { onDelete: 'cascade' }),
  doseTime: time('dose_time').notNull(),
  reminderMinutes: integer('reminder_minutes').default(0).notNull(),
  snoozeMinutes: integer('snooze_minutes').default(10).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  ...timestamps,
})

export const medicationLogs = pgTable('medication_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  medicationId: uuid('medication_id').notNull().references(() => medications.id, { onDelete: 'cascade' }),
  scheduleId: uuid('schedule_id').references(() => medicationSchedules.id, { onDelete: 'set null' }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  status: text('status').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const healthMetrics = pgTable('health_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  metricType: text('metric_type').notNull(),
  value: numeric('value').notNull(),
  secondaryValue: numeric('secondary_value'),
  unit: text('unit').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  activityType: text('activity_type').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  distanceKm: numeric('distance_km'),
  calories: integer('calories'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const sleepRecords = pgTable('sleep_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  bedtime: timestamp('bedtime', { withTimezone: true }).notNull(),
  wakeTime: timestamp('wake_time', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  quality: integer('quality').notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const waterLogs = pgTable('water_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  amountMl: integer('amount_ml').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
})

export const symptoms = pgTable('symptoms', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  symptom: text('symptom').notNull(),
  severity: integer('severity').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  frequency: text('frequency'),
  possibleTrigger: text('possible_trigger'),
  notes: text('notes'),
  ...timestamps,
})

export const moodRecords = pgTable('mood_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  mood: text('mood').notNull(),
  stressLevel: integer('stress_level'),
  energyLevel: integer('energy_level'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  doctor: text('doctor').notNull(),
  clinic: text('clinic'),
  appointmentType: text('appointment_type').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  location: text('location'),
  notes: text('notes'),
  attachmentName: text('attachment_name'),
  reminders: jsonb('reminders').$type<number[]>().default([10080, 1440, 60]),
  ...timestamps,
})

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  ...timestamps,
})

export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  detail: text('detail'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  sourceId: text('source_id'),
  ...timestamps,
})

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  insightType: text('insight_type').notNull(),
  message: text('message').notNull(),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  ...timestamps,
})
