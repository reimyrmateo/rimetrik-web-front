import * as RadixTabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export interface TabItem {
  value: string
  label: string
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: readonly TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  label: string
}

export function Tabs({ items, value, defaultValue, onValueChange, label }: TabsProps) {
  const rootProps = {
    ...(value !== undefined ? { value } : {}),
    ...(onValueChange ? { onValueChange } : {}),
    defaultValue: defaultValue ?? items[0]?.value,
  }

  return (
    <RadixTabs.Root {...rootProps}>
      <RadixTabs.List aria-label={label} className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              '-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50',
              'data-[state=active]:border-brand-600 data-[state=active]:text-brand-700',
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="focus:outline-none">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
