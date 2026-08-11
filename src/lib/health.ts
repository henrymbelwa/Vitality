export type HealthData = {
  profile: Record<string, any>
  medications: Array<Record<string, any>>
  schedules: Array<Record<string, any>>
  medicationLogs: Array<Record<string, any>>
  metrics: Array<Record<string, any>>
  activities: Array<Record<string, any>>
  sleep: Array<Record<string, any>>
  water: Array<Record<string, any>>
  symptoms: Array<Record<string, any>>
  moods: Array<Record<string, any>>
  appointments: Array<Record<string, any>>
  notifications: Array<Record<string, any>>
  timeline: Array<Record<string, any>>
  insights: Array<Record<string, any>>
  demo?: boolean
}

const now = new Date()
const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString()
const ahead = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString()

export const fictionalDemoData: HealthData = {
  demo: true,
  profile: { fullName: 'Alex Morgan', bloodType: 'O+', waterTargetMl: 2500, allergies: 'Penicillin sensitivity (fictional)', conditions: 'No conditions recorded', emergencyContact: 'Jordan Morgan · (555) 014-0284', doctorContact: 'Dr. Maya Chen · (555) 014-0198', heightCm: '174', weightKg: '72.4' },
  medications: [
    { id: 'demo-med-1', name: 'Amoxicillin', dosage: '500', unit: 'mg', frequency: '3 times daily', instructions: 'Complete the prescribed course', foodInstruction: 'With food', prescribingDoctor: 'Dr. Maya Chen', status: 'active' },
    { id: 'demo-med-2', name: 'Vitamin D', dosage: '1000', unit: 'IU', frequency: 'Once daily', instructions: 'Take with breakfast', status: 'active' },
  ],
  schedules: [
    { id: 'demo-sch-1', medicationId: 'demo-med-1', doseTime: '08:00:00' },
    { id: 'demo-sch-2', medicationId: 'demo-med-1', doseTime: '14:00:00' },
    { id: 'demo-sch-3', medicationId: 'demo-med-1', doseTime: '20:00:00' },
    { id: 'demo-sch-4', medicationId: 'demo-med-2', doseTime: '08:00:00' },
  ],
  medicationLogs: [{ id: 'demo-log-1', medicationId: 'demo-med-2', scheduleId: 'demo-sch-4', status: 'taken', recordedAt: ago(4) }],
  metrics: [
    { id: 'm1', metricType: 'Heart rate', value: '68', unit: 'bpm', recordedAt: ago(2) },
    { id: 'm2', metricType: 'Weight', value: '72.4', unit: 'kg', recordedAt: ago(26) },
    { id: 'm3', metricType: 'Blood pressure', value: '118', secondaryValue: '76', unit: 'mmHg', recordedAt: ago(3) },
    { id: 'm4', metricType: 'Oxygen saturation', value: '98', unit: '%', recordedAt: ago(5) },
  ],
  activities: [{ id: 'a1', activityType: 'Walking', durationMinutes: 32, distanceKm: '2.8', calories: 146, occurredAt: ago(4) }, { id: 'a2', activityType: 'Gym', durationMinutes: 45, calories: 310, occurredAt: ago(28) }],
  sleep: [{ id: 's1', durationMinutes: 432, quality: 4, bedtime: ago(15), wakeTime: ago(7.8) }],
  water: [{ id: 'w1', amountMl: 500, recordedAt: ago(5) }, { id: 'w2', amountMl: 500, recordedAt: ago(3) }, { id: 'w3', amountMl: 250, recordedAt: ago(1) }],
  symptoms: [{ id: 'sy1', symptom: 'Headache', severity: 3, startedAt: ago(30), endedAt: ago(28), possibleTrigger: 'Poor sleep', notes: 'Resolved after rest' }],
  moods: [{ id: 'mo1', mood: 'Good', stressLevel: 3, energyLevel: 7, recordedAt: ago(1), notes: 'Feeling focused' }],
  appointments: [{ id: 'ap1', doctor: 'Dr. Maya Chen', clinic: 'Northstar Wellness Clinic', appointmentType: 'Annual wellness visit', startsAt: ahead(9), location: 'Suite 410 · Video option available', notes: 'Bring current medication list' }],
  notifications: [{ id: 'n1', type: 'medication', title: 'Medication due soon', message: 'Amoxicillin 500 mg is scheduled for 2:00 PM.', isRead: false, createdAt: ago(1) }, { id: 'n2', type: 'check-in', title: 'Daily check-in', message: 'Take 45 seconds to record how you feel today.', isRead: false, createdAt: ago(2) }],
  timeline: [
    { id: 't1', eventType: 'mood', title: 'Mood check-in: Good', detail: 'Energy 7/10', occurredAt: ago(1) },
    { id: 't2', eventType: 'water', title: '250 ml water logged', detail: 'Daily hydration', occurredAt: ago(1.2) },
    { id: 't3', eventType: 'measurement', title: 'Blood pressure recorded', detail: '118/76 mmHg', occurredAt: ago(3) },
    { id: 't4', eventType: 'activity', title: '32-minute walk', detail: '2.8 km · 146 kcal', occurredAt: ago(4) },
    { id: 't5', eventType: 'medication', title: 'Vitamin D taken', detail: '1000 IU', occurredAt: ago(4.5) },
  ],
  insights: [{ id: 'i1', insightType: 'sleep', message: 'Your latest sleep record was 7h 12m.' }, { id: 'i2', insightType: 'hydration', message: 'You have logged 1,250 ml toward today’s 2,500 ml target.' }, { id: 'i3', insightType: 'activity', message: 'Your latest walk added 32 active minutes.' }],
}

export async function healthRequest(action?: string, data?: Record<string, unknown>): Promise<any> {
  const response = await fetch('/api/health', {
    method: action ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: action ? { 'Content-Type': 'application/json' } : undefined,
    body: action ? JSON.stringify({ action, data }) : undefined,
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Request failed')
  return payload
}
