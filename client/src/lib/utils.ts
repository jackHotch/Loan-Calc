import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { LoanDb, LoanTable, LoanForm } from '../constants/schema'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const localDate = `${month} / ${day} / ${year}`
  return localDate
}

export function dbToTable(loan: LoanDb): LoanTable {
  return {
    id: loan.id.toString(),
    name: loan.name,
    lender: loan.lender || '',
    current_balance: formatCurrency(loan.current_principal + loan.accrued_interest),
    interest_rate: `${loan.interest_rate}%`,
    starting_principal: formatCurrency(loan.starting_principal),
    remaining_principal: formatCurrency(loan.current_principal),
    accrued_interest: formatCurrency(loan.accrued_interest),
    minimum_payment: formatCurrency(loan.minimum_payment),
    extra_payment: formatCurrency(loan.extra_payment || 0),
    start_date: formatDate(loan.start_date),
    payoff_date: formatDate(loan.payoff_date),
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}

// For form submissions (creating new loan)
export function formToDb(form: LoanForm, userId: bigint): Omit<LoanDb, 'id'> {
  return {
    user_id: userId,
    name: form.name,
    lender: form.lender || null,
    starting_principal: form.starting_principal,
    current_principal: form.remaining_principal,
    accrued_interest: form.accrued_interest,
    interest_rate: form.interest_rate,
    minimum_payment: form.minimum_payment,
    start_date: form.start_date,
    payoff_date: form.payoff_date,
    extra_payment: form.extra_payment || null,
  }
}

export function tableToForm(loan: LoanTable): LoanForm {
  if (!loan) return undefined

  return {
    id: loan.id,
    name: loan.name,
    lender: loan.lender,
    start_date: parseDate(loan.start_date),
    payoff_date: parseDate(loan.payoff_date),
    starting_principal: parseCurrency(loan.starting_principal),
    remaining_principal: parseCurrency(loan.remaining_principal),
    accrued_interest: parseCurrency(loan.accrued_interest),
    interest_rate: parsePercentage(loan.interest_rate),
    current_balance: parseCurrency(loan.remaining_principal) + parseCurrency(loan.accrued_interest),
    minimum_payment: parseCurrency(loan.minimum_payment),
    extra_payment: parseCurrency(loan.extra_payment),
  }
}

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/\$/g, '').replace(/,/g, '').trim())
}

function parsePercentage(value: string): number {
  return parseFloat(value.replace('%', ''))
}

function parseDate(value: string): Date {
  return new Date(value)
}
