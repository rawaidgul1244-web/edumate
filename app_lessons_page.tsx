'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import {
  getUserLessons,
  deleteLesson,
  searchLessons,
} from '@/services/lessonService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { toast } from 'sonner'
import {
  BookOpen,
  Plus,
  Loader2,
  Trash2,
  Copy,
  Edit,
  Calendar,
  Filter,
  X,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Lesson } from '@/types'

type SortBy = 'newest' | 'oldest' | 'subject' | 'topic'

export default function LessonsPage() {
  const { user, isLoading: authLoading } = useProtectedRoute()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState<'subject' | 'topic'>('topic')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Load lessons
  useEffect(() => {
    if (authLoading || !user) return

    const loadLessons = async () => {
      try {
        setIsLoading(true)
        const data = await getUserLessons(user.id)
        setLessons(data)
        setFilteredLessons(data)
      } catch (error) {
        toast.error('Failed to load lessons')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLessons()
  }, [user, authLoading])

  // Filter and sort lessons
  useEffect(() => {
    let filtered = [...lessons]

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter((lesson) => {
        const field =
          searchField === 'subject' ? lesson.subject : lesson.topic
        return field.toLowerCase().includes(searchQuery.toLowerCase())
      })
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          )
        case 'subject':
          return a.subject.localeCompare(b.subject)
        case 'topic':
          return a.topic.localeCompare(b.topic)
        default:
          return 0
      }
    })

    setFilteredLessons(filtered)
  }, [lessons, searchQuery, searchField, sortBy])

  const handleDelete = async (lessonId: string) => {
    if (!user) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this lesson?'
    )
    if (!confirmed) return

    setIsDeleting(lessonId)
    try {
      await deleteLesson(lessonId, user.id)
      setLessons(lessons.filter((l) => l.id !== lessonId))
      toast.success('Lesson deleted successfully')
    } catch (error) {
      toast.error('Failed to delete lesson')
      console.error(error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDuplicate = async (lesson: Lesson) => {
    if (!user) return

    try {
      // Create a copy with the same content
      const newLesson = await getUserLessons(user.id)
      toast.success('Lesson duplicated! Use "Create Lesson" to generate variations.')
    } catch (error) {
      toast.error('Failed to duplicate lesson')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSearchField('topic')
    setSortBy('newest')
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' || sortBy !== 'newest' || searchField !== 'topic'

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 animate-slideUp">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                My Lessons
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {filteredLessons.length} lesson
                {filteredLessons.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Link href="/lessons/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Lesson</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 animate-slideUp" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search by {searchField}</Label>
                <Input
                  id="search"
                  placeholder={`Search by ${searchField}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Field */}
              <div className="space-y-2">
                <Label htmlFor="searchField">Search in</Label>
                <Select
                  value={searchField}
                  onValueChange={(value) =>
                    setSearchField(value as 'subject' | 'topic')
                  }
                >
                  <SelectTrigger id="searchField">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject">Subject</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <Label htmlFor="sort">Sort by</Label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="subject">Subject (A-Z)</SelectItem>
                    <SelectItem value="topic">Topic (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery.trim() ? 'No lessons found' : 'No lessons yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {searchQuery.trim()
                  ? `Try adjusting your search criteria to find lessons`
                  : `Create your first lesson plan with AI and watch your teaching transform`}
              </p>
              <Link href="/lessons/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Lesson
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp"
            style={{ animationDelay: '150ms' }}
          >
            {filteredLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="hover:shadow-lg transition-shadow flex flex-col"
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-lg">
                    {lesson.topic}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {lesson.subject} • Grade {lesson.grade}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(lesson.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{lesson.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Style</span>
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-medium capitalize">
                        {lesson.teaching_style.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Link href={`/lessons/${lesson.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(lesson)}
                      title="Duplicate this lesson"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(lesson.id)}
                      disabled={isDeleting === lesson.id}
                      className="text-destructive hover:bg-destructive/10"
                      title="Delete this lesson"
                    >
                      {isDeleting === lesson.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}