'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilter: (filters: Record<string, string>) => void
  onClear: () => void
  filters?: Array<{
    key: string
    label: string
    options: Array<{ value: string; label: string }>
  }>
  className?: string
  placeholder?: string
}

export function SearchFilter({
  onSearch,
  onFilter,
  onClear,
  filters = [],
  className,
  placeholder = "Search products..."
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters }
    if (value === "all" || value === "") {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    setActiveFilters(newFilters)
    onFilter(newFilters)
  }

  const handleClear = () => {
    setSearchQuery("")
    setActiveFilters({})
    onClear()
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="text-sm font-medium mb-2 block">
                {filter.label}
              </label>
              <Select
                value={activeFilters[filter.key] || "all"}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
