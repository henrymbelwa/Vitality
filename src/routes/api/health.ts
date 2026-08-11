import { createFileRoute } from '@tanstack/react-router'
import { getUser } from '@netlify/identity'
import { and, desc, eq, gte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import {
  activities,
  aiInsights,
  appointments,
  healthMetrics,
  medicationLogs,
  medications,
  medicationSchedules,
  moodRecords,
  notifications,
  profiles,
  sleepRecords,
  symptoms,
  timelineEvents,
  waterLogs,
} from '../../../db/schema.js'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const user = await getUser()
        if (!user) return json({ error: 'Authentication required' }, 401)
        await ensureProfileAndDemo(user.id, user.email ?? '', user.name ?? '')
        return json(await getDashboard(user.id))
      },
      POST: async ({ request }) => {
        const user = await getUser()
        if (!user) return json({ error: 'Authentication required' }, 401)

        try {
          const input = actionSchema.parse(await request.json())
          const result = await performAction(user.id, input.action, input.data)
          return json({ ok: true, result })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to save record'
          return json({ error: message }, 400)
        }
      },
    },
  },
})

const actionSchema = z.object({
  action: z.string().min(1),
  data: z.record(z.string(), z.unknown()).default({}),
})

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function ensureProfileAndDemo(userId: string, email: string, fullName: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)
  if (profile?.demoSeeded) return

  if (!profile) {
    await db.insert(profiles).values({
      userId,
      email,
      fullName: fullName || 'Future Health Member',
      bloodType: 'O+',
      allergies: 'No allergies recorded',
      emergencyContact: 'Add an emergency contact',
      waterTargetMl: 2500,
      demoSeeded: true,
    })
  } else {
    await db.update(profiles).set({ demoSeeded: true, updatedAt: new Date() }).where(eq(profiles.userId, userId))
  }

  const now = new Date()
  const dateOnly = now.toISOString().slice(0, 10)
  const [amoxicillin] = await db.insert(medications).values({
    userId,
    name: 'Amoxicillin',
    dosage: '500',
    unit: 'mg',
    frequency: '3 times daily',
    startDate: dateOnly,
    instructions: 'Complete the prescribed course',
    foodInstruction: 'With food',
    prescribingDoctor: 'Dr. Maya Chen',
    notes: 'Fictional demo medication',
  }).returning()
  const [vitamin] = await db.insert(medications).values({
    userId,
    name: 'Vitamin D',
    dosage: '1000',
    unit: 'IU',
    frequency: 'Once daily',
    startDate: dateOnly,
    instructions: 'Take with breakfast',
    foodInstruction: 'With food',
    notes: 'Fictional demo supplement',
  }).returning()
  await db.insert(medicationSchedules).values([
    { userId, medicationId: amoxicillin.id, doseTime: '08:00:00' },
    { userId, medicationId: amoxicillin.id, doseTime: '14:00:00' },
    { userId, medicationId: amoxicillin.id, doseTime: '20:00:00' },
    { userId, medicationId: vitamin.id, doseTime: '08:00:00' },
  ])

  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000)
  const daysFromNow = (days: number, hour = 10) => {
    const value = new Date(now)
    value.setDate(value.getDate() + days)
    value.setHours(hour, 0, 0, 0)
    return value
  }
  await db.insert(healthMetrics).values([
    { userId, metricType: 'Heart rate', value: '68', unit: 'bpm', recordedAt: hoursAgo(2), notes: 'Resting' },
    { userId, metricType: 'Weight', value: '72.4', unit: 'kg', recordedAt: hoursAgo(26) },
    { userId, metricType: 'Blood pressure', value: '118', secondaryValue: '76', unit: 'mmHg', recordedAt: hoursAgo(3) },
    { userId, metricType: 'Oxygen saturation', value: '98', unit: '%', recordedAt: hoursAgo(5) },
  ])
  await db.insert(activities).values([
    { userId, activityType: 'Walking', durationMinutes: 32, distanceKm: '2.8', calories: 146, occurredAt: hoursAgo(4), notes: 'Fictional riverside walk' },
    { userId, activityType: 'Gym', durationMinutes: 45, calories: 310, occurredAt: hoursAgo(28), notes: 'Fictional strength session' },
  ])
  await db.insert(waterLogs).values([
    { userId, amountMl: 500, recordedAt: hoursAgo(5) },
    { userId, amountMl: 500, recordedAt: hoursAgo(3) },
    { userId, amountMl: 250, recordedAt: hoursAgo(1) },
  ])
  await db.insert(sleepRecords).values({
    userId,
    bedtime: hoursAgo(15),
    wakeTime: hoursAgo(7.8),
    durationMinutes: 432,
    quality: 4,
    notes: 'Fictional demo record',
  })
  await db.insert(moodRecords).values({
    userId,
    mood: 'Good',
    stressLevel: 3,
    energyLevel: 7,
    recordedAt: hoursAgo(1),
    notes: 'Feeling focused',
  })
  await db.insert(symptoms).values({
    userId,
    symptom: 'Headache',
    severity: 3,
    startedAt: hoursAgo(30),
    endedAt: hoursAgo(28),
    frequency: 'Once',
    possibleTrigger: 'Poor sleep',
    notes: 'Fictional demo symptom',
  })
  await db.insert(appointments).values({
    userId,
    doctor: 'Dr. Maya Chen',
    clinic: 'Northstar Wellness Clinic',
    appointmentType: 'Annual wellness visit',
    startsAt: daysFromNow(9, 10),
    location: 'Suite 410 · Video option available',
    notes: 'Bring current medication list. Fictional appointment.',
  })
  await db.insert(notifications).values([
    { userId, type: 'medication', title: 'Medication schedule ready', message: 'Your fictional demo medication schedule is active.' },
    { userId, type: 'check-in', title: 'Daily check-in', message: 'Take 45 seconds to record how you feel today.' },
  ])
  await db.insert(timelineEvents).values([
    { userId, eventType: 'water', title: '500 ml water logged', occurredAt: hoursAgo(3), detail: 'Daily hydration' },
    { userId, eventType: 'activity', title: '32-minute walk', occurredAt: hoursAgo(4), detail: '2.8 km · 146 kcal' },
    { userId, eventType: 'measurement', title: 'Blood pressure recorded', occurredAt: hoursAgo(3), detail: '118/76 mmHg' },
    { userId, eventType: 'mood', title: 'Mood check-in: Good', occurredAt: hoursAgo(1), detail: 'Energy 7/10' },
  ])
  await db.insert(aiInsights).values([
    { userId, insightType: 'sleep', message: 'Your latest fictional sleep record was 7h 12m.' },
    { userId, insightType: 'hydration', message: 'You have logged 1,250 ml toward today’s 2,500 ml target.' },
    { userId, insightType: 'activity', message: 'Your latest walk added 32 active minutes.' },
  ])
}

async function getDashboard(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)
  const medicationRows = await db.select().from(medications).where(eq(medications.userId, userId)).orderBy(desc(medications.createdAt))
  const scheduleRows = await db.select().from(medicationSchedules).where(and(eq(medicationSchedules.userId, userId), eq(medicationSchedules.enabled, true)))
  const logs = await db.select().from(medicationLogs).where(and(eq(medicationLogs.userId, userId), gte(medicationLogs.scheduledFor, today))).orderBy(desc(medicationLogs.recordedAt))
  const metrics = await db.select().from(healthMetrics).where(eq(healthMetrics.userId, userId)).orderBy(desc(healthMetrics.recordedAt)).limit(100)
  const activityRows = await db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.occurredAt)).limit(100)
  const sleep = await db.select().from(sleepRecords).where(eq(sleepRecords.userId, userId)).orderBy(desc(sleepRecords.bedtime)).limit(60)
  const water = await db.select().from(waterLogs).where(eq(waterLogs.userId, userId)).orderBy(desc(waterLogs.recordedAt)).limit(100)
  const symptomRows = await db.select().from(symptoms).where(eq(symptoms.userId, userId)).orderBy(desc(symptoms.startedAt)).limit(100)
  const moods = await db.select().from(moodRecords).where(eq(moodRecords.userId, userId)).orderBy(desc(moodRecords.recordedAt)).limit(100)
  const appointmentRows = await db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(appointments.startsAt).limit(50)
  const notificationRows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50)
  const timeline = await db.select().from(timelineEvents).where(eq(timelineEvents.userId, userId)).orderBy(desc(timelineEvents.occurredAt)).limit(150)
  const insights = await db.select().from(aiInsights).where(eq(aiInsights.userId, userId)).orderBy(desc(aiInsights.createdAt)).limit(12)
  return { profile, medications: medicationRows, schedules: scheduleRows, medicationLogs: logs, metrics, activities: activityRows, sleep, water, symptoms: symptomRows, moods, appointments: appointmentRows, notifications: notificationRows, timeline, insights, demo: true }
}

async function performAction(userId: string, action: string, data: Record<string, unknown>) {
  const now = new Date()
  const text = (key: string, fallback = '') => String(data[key] ?? fallback).trim()
  const number = (key: string, fallback = 0) => Number(data[key] ?? fallback)
  const date = (key: string, fallback = now) => new Date(String(data[key] ?? fallback.toISOString()))

  if (action === 'addMedication') {
    const input = z.object({ name: z.string().min(2), dosage: z.coerce.number().positive(), unit: z.string().min(1), frequency: z.string().min(1), startDate: z.string().min(8), endDate: z.string().optional(), times: z.string().min(4), instructions: z.string().optional(), foodInstruction: z.string().optional(), prescribingDoctor: z.string().optional(), notes: z.string().optional() }).parse(data)
    const { times: scheduleTimes, ...medicationInput } = input
    const [medication] = await db.insert(medications).values({ ...medicationInput, dosage: String(input.dosage), endDate: input.endDate || null, userId, status: 'active' }).returning()
    const times = scheduleTimes.split(',').map((value) => value.trim()).filter(Boolean)
    await db.insert(medicationSchedules).values(times.map((doseTime) => ({ userId, medicationId: medication.id, doseTime: doseTime.length === 5 ? `${doseTime}:00` : doseTime })))
    await addTimeline(userId, 'medication', `${medication.name} added`, `${medication.dosage} ${medication.unit} · ${input.frequency}`, medication.id)
    return medication
  }

  if (action === 'doseStatus') {
    const input = z.object({ medicationId: z.string().uuid(), scheduleId: z.string().uuid().optional(), status: z.enum(['taken', 'skipped', 'missed', 'delayed']), scheduledFor: z.string().optional() }).parse(data)
    const [medication] = await db.select().from(medications).where(and(eq(medications.id, input.medicationId), eq(medications.userId, userId))).limit(1)
    if (!medication) throw new Error('Medication not found')
    const [log] = await db.insert(medicationLogs).values({ userId, medicationId: medication.id, scheduleId: input.scheduleId ?? null, scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : now, status: input.status }).returning()
    await addTimeline(userId, 'medication', `${medication.name} ${input.status}`, `${medication.dosage} ${medication.unit}`, log.id)
    return log
  }

  if (action === 'medicationState') {
    const input = z.object({ id: z.string().uuid(), status: z.enum(['active', 'paused', 'ended']) }).parse(data)
    return db.update(medications).set({ status: input.status, updatedAt: now }).where(and(eq(medications.id, input.id), eq(medications.userId, userId))).returning()
  }

  if (action === 'addMetric') {
    const metricType = text('metricType')
    if (!metricType || !number('value')) throw new Error('Metric type and value are required')
    const [record] = await db.insert(healthMetrics).values({ userId, metricType, value: String(number('value')), secondaryValue: data.secondaryValue ? String(number('secondaryValue')) : null, unit: text('unit'), recordedAt: date('recordedAt'), notes: text('notes') }).returning()
    await addTimeline(userId, 'measurement', `${metricType} recorded`, `${record.value}${record.secondaryValue ? `/${record.secondaryValue}` : ''} ${record.unit}`, record.id)
    return record
  }

  if (action === 'addActivity') {
    const [record] = await db.insert(activities).values({ userId, activityType: text('activityType'), durationMinutes: number('durationMinutes'), distanceKm: data.distanceKm ? String(number('distanceKm')) : null, calories: data.calories ? number('calories') : null, occurredAt: date('occurredAt'), notes: text('notes') }).returning()
    await addTimeline(userId, 'activity', `${record.activityType} recorded`, `${record.durationMinutes} minutes`, record.id)
    return record
  }

  if (action === 'addWater') {
    const amountMl = number('amountMl')
    if (amountMl < 1 || amountMl > 5000) throw new Error('Enter a valid water amount')
    const [record] = await db.insert(waterLogs).values({ userId, amountMl, recordedAt: date('recordedAt') }).returning()
    await addTimeline(userId, 'water', `${amountMl} ml water logged`, 'Daily hydration', record.id)
    return record
  }

  if (action === 'addSleep') {
    const bedtime = date('bedtime')
    const wakeTime = date('wakeTime')
    const durationMinutes = Math.max(0, Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000))
    if (!durationMinutes) throw new Error('Wake time must be after bedtime')
    const [record] = await db.insert(sleepRecords).values({ userId, bedtime, wakeTime, durationMinutes, quality: number('quality', 3), notes: text('notes') }).returning()
    await addTimeline(userId, 'sleep', 'Sleep recorded', `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`, record.id)
    return record
  }

  if (action === 'addSymptom') {
    const [record] = await db.insert(symptoms).values({ userId, symptom: text('symptom'), severity: number('severity'), startedAt: date('startedAt'), endedAt: data.endedAt ? date('endedAt') : null, frequency: text('frequency'), possibleTrigger: text('possibleTrigger'), notes: text('notes') }).returning()
    await addTimeline(userId, 'symptom', `${record.symptom} recorded`, `Severity ${record.severity}/10`, record.id)
    return record
  }

  if (action === 'addMood') {
    const [record] = await db.insert(moodRecords).values({ userId, mood: text('mood'), stressLevel: number('stressLevel'), energyLevel: number('energyLevel'), recordedAt: date('recordedAt'), notes: text('notes') }).returning()
    await addTimeline(userId, 'mood', `Mood check-in: ${record.mood}`, `Energy ${record.energyLevel}/10`, record.id)
    return record
  }

  if (action === 'addAppointment') {
    const [record] = await db.insert(appointments).values({ userId, doctor: text('doctor'), clinic: text('clinic'), appointmentType: text('appointmentType'), startsAt: date('startsAt'), location: text('location'), notes: text('notes'), attachmentName: text('attachmentName') }).returning()
    await addTimeline(userId, 'appointment', `${record.appointmentType} scheduled`, `${record.doctor} · ${record.clinic ?? ''}`, record.id)
    return record
  }

  if (action === 'dailyCheckin') {
    const mood = text('mood', 'Neutral')
    const waterMl = number('waterMl')
    const exercised = text('exercised', 'No') === 'Yes'
    const symptom = text('symptom')
    await db.insert(moodRecords).values({ userId, mood, stressLevel: number('stressLevel', 5), energyLevel: number('energyLevel', 5), notes: text('notes') })
    if (waterMl > 0) await db.insert(waterLogs).values({ userId, amountMl: waterMl })
    if (exercised) await db.insert(activities).values({ userId, activityType: 'Daily check-in activity', durationMinutes: number('exerciseMinutes', 15), notes: 'Recorded through daily check-in' })
    if (symptom) await db.insert(symptoms).values({ userId, symptom, severity: number('severity', 3), startedAt: now, notes: 'Recorded through daily check-in' })
    await addTimeline(userId, 'mood', `Daily check-in: ${mood}`, `${waterMl} ml water · Medications ${text('medicationsTaken', 'not answered').toLowerCase()}`, crypto.randomUUID())
    return { completedAt: now }
  }

  if (action === 'updateProfile') {
    const values = { fullName: text('fullName'), dateOfBirth: text('dateOfBirth') || null, gender: text('gender') || null, bloodType: text('bloodType') || null, heightCm: data.heightCm ? String(number('heightCm')) : null, weightKg: data.weightKg ? String(number('weightKg')) : null, emergencyContact: text('emergencyContact'), doctorContact: text('doctorContact'), allergies: text('allergies'), conditions: text('conditions'), currentMedications: text('currentMedications'), waterTargetMl: number('waterTargetMl', 2500), updatedAt: now }
    return db.update(profiles).set(values).where(eq(profiles.userId, userId)).returning()
  }

  if (action === 'notificationRead') {
    const id = text('id')
    return db.update(notifications).set({ isRead: true, updatedAt: now }).where(and(eq(notifications.id, id), eq(notifications.userId, userId))).returning()
  }

  if (action === 'notificationDelete') {
    const id = text('id')
    return db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId))).returning()
  }

  throw new Error('Unsupported action')
}

async function addTimeline(userId: string, eventType: string, title: string, detail: string, sourceId: string) {
  await db.insert(timelineEvents).values({ userId, eventType, title, detail, sourceId })
}
