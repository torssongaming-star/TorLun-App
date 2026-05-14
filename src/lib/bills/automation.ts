import { createClient } from '@/utils/supabase/server'
import { Bill } from '@/types/database'

export async function createNextMonthBills(month: number, year: number) {
  const supabase = await createClient()
  
  // Calculate next month
  let nextMonth = month + 1
  let nextYear = year
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }

  // 1. Get all recurring bills for the current month
  const { data: bills } = await supabase
    .from('bills')
    .select('*')
    .eq('is_recurring', true)
    .eq('auto_create_next_month', true)
    // We filter by date to get bills in the source month
    .gte('date', `${year}-${month.toString().padStart(2, '0')}-01`)
    .lte('date', `${year}-${month.toString().padStart(2, '0')}-31`)

  if (!bills || bills.length === 0) {
    return { created: 0, skipped: 0 }
  }

  // 2. Get existing bills for next month to avoid duplicates
  const { data: existingNextBills } = await supabase
    .from('bills')
    .gte('date', `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`)
    .lte('date', `${nextYear}-${nextMonth.toString().padStart(2, '0')}-31`)

  let createdCount = 0
  let skippedCount = 0

  for (const bill of bills) {
    // Duplicate check
    const isDuplicate = existingNextBills?.some(eb => 
      eb.title === bill.title && 
      eb.amount === bill.amount && 
      // Extract day from current bill and set it for next month
      eb.date.split('-')[2] === bill.date.split('-')[2]
    )

    if (isDuplicate) {
      skippedCount++
      continue
    }

    // Prepare new bill date
    const day = bill.date.split('-')[2]
    const nextDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${day}`

    const { error } = await supabase
      .from('bills')
      .insert({
        title: bill.title,
        amount: bill.amount,
        date: nextDate,
        category: bill.category,
        category_id: bill.category_id,
        owner: bill.owner,
        split_type: bill.split_type,
        split_value: bill.split_value,
        paid_by: bill.paid_by,
        payment_method: bill.payment_method,
        is_recurring: bill.is_recurring,
        auto_create_next_month: bill.auto_create_next_month,
        bankgiro_number: bill.bankgiro_number,
        ocr_number: bill.ocr_number,
        supplier_name: bill.supplier_name,
        notes: bill.notes,
        created_by: bill.created_by,
        is_paid: false,
        paid_at: null,
        paid_by_user_id: null
      })

    if (!error) {
      createdCount++
    }
  }

  return { created: createdCount, skipped: skippedCount }
}
