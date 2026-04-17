import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Filter,
  LogOut,
  MapPin,
  MessageSquare,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import TicketTable from './components/TicketTable'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const API_URL = `${API_BASE_URL}/api/tickets`
const ASSIGNED_TICKETS_URL = `${API_BASE_URL}/api/tickets/assigned`
const AUTH_URL = `${API_BASE_URL}/api/auth`
const USER_API_URL = `${API_BASE_URL}/api/users`
const ASSIGNEE_API_URL = `${API_BASE_URL}/api/users/assignees`
const CATEGORY_API_URL = `${API_BASE_URL}/api/categories`
const AUTH_STORAGE_KEY = 'scss-auth-token'

const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const userRoleOptions = ['ADMIN', 'STAFF', 'ASSIGNEE']
const staffNavItems = [
  { key: 'operations', label: 'Dashboard' },
  { key: 'ticket-management', label: 'Ticket Management' },
  { key: 'assignee-management', label: 'Assignee Management' },
  { key: 'category-management', label: 'Department Management' },
]
const adminOnlyNavItems = [
  { key: 'user-management', label: 'User Management' },
]
const assigneeNavItems = [{ key: 'assigned-tickets', label: 'Assigned Tickets' }]
const basicAccessNavItems = [{ key: 'report-issue', label: 'Submit Ticket' }]

const statusConfig = {
  OPEN: {
    label: 'Open',
    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  },
}

const fallbackCategoryMeta = {
  'IT Support': {
    department: 'Information Technology Centre',
    assignees: ['Aisyah Rahman', 'Imran Sofi', 'Faris Hakim'],
    serviceLabel: 'Network & systems',
    location: 'Computer Lab 2',
    sla: '4 hours',
  },
  Maintenance: {
    department: 'Campus Maintenance Unit',
    assignees: ['Nur Amira', 'Syafiq Halim', 'Faiz Nordin'],
    serviceLabel: 'Buildings & utilities',
    location: 'Engineering Block',
    sla: '8 hours',
  },
  Security: {
    department: 'Campus Security Office',
    assignees: ['Aminuddin Salleh', 'Hakim Zulkifli'],
    serviceLabel: 'Safety & patrol',
    location: 'Main Gate',
    sla: '30 minutes',
  },
  Academic: {
    department: 'Academic Affairs Division',
    assignees: ['Dr. Hana Yusuf', 'Nadia Roslan'],
    serviceLabel: 'Academic services',
    location: 'Lecture Hall Complex',
    sla: '1 business day',
  },
  Facilities: {
    department: 'Facilities Management Office',
    assignees: ['Aisyah Karim', 'Roslan Mamat', 'Aidil Danish'],
    serviceLabel: 'Rooms & assets',
    location: 'Student Centre',
    sla: '6 hours',
  },
}

const fallbackCategoryOptions = Object.keys(fallbackCategoryMeta)

const commentTemplates = {
  OPEN: [
    'Ticket received by the support desk and awaiting department review.',
    'Initial triage completed and location details confirmed.',
  ],
  IN_PROGRESS: [
    'Technician assigned and working on the issue.',
    'Follow-up update sent to the requestor while work is in progress.',
  ],
  RESOLVED: [
    'Issue resolved on site and pending requestor confirmation.',
    'Resolution notes captured for future reporting.',
  ],
  CLOSED: ['Ticket closed after confirmation from the requestor.'],
}

const demoTickets = [
  {
    id: 1042,
    title: 'Wi-Fi outage in Lab 2',
    category: 'IT Support',
    description:
      'Students in Lab 2 cannot connect to the campus network since the first morning session.',
    status: 'IN_PROGRESS',
    createdAt: '2026-04-05T08:20:00',
  },
  {
    id: 1038,
    title: 'Air-conditioning leaking in Lecture Hall B',
    category: 'Facilities',
    description:
      'Water is dripping from the ceiling vent and several seats are affected near the front row.',
    status: 'OPEN',
    createdAt: '2026-04-05T07:40:00',
  },
  {
    id: 1035,
    title: 'Projector input not working in DK1',
    category: 'Academic',
    description:
      'Lecturers can power on the projector, but HDMI input is not detected during classes.',
    status: 'RESOLVED',
    createdAt: '2026-04-04T15:05:00',
  },
]

const initialForm = {
  requesterName: '',
  requesterEmail: '',
  title: '',
  category: '',
  description: '',
}

const initialUserForm = {
  username: '',
  email: '',
  password: '',
  role: 'STAFF',
}

const initialCategoryForm = {
  name: '',
  department: '',
  serviceLabel: '',
  defaultLocation: '',
  responseTarget: '',
}

function formatDateTime(value) {
  if (!value) {
    return 'Pending sync'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate)
}

function getStatusLabel(status) {
  return statusConfig[status]?.label || status || 'Unknown'
}

function isOperationsRole(role) {
  return role === 'ADMIN' || role === 'STAFF'
}

function isAssigneeRole(role) {
  return role === 'ASSIGNEE'
}

function buildComments(status, assignee) {
  const actor = assignee || 'Support Desk'

  return (commentTemplates[status] || commentTemplates.OPEN).map((message, index) => ({
    id: `${status}-${index}-${actor}`,
    author: index === 0 ? 'SCSS System' : actor,
    role: index === 0 ? 'System' : 'Staff',
    message,
    createdAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 45).toISOString(),
  }))
}

function enrichTicket(ticket, index = 0, categoryDirectory = fallbackCategoryMeta) {
  const meta = categoryDirectory[ticket.category] || fallbackCategoryMeta['Facilities']
  const assignee = ticket.assignee || 'Unassigned'
  const status = ticket.status || 'OPEN'
  const location = ticket.location || meta.location
  const createdAt = ticket.createdAt || new Date().toISOString()

  return {
    ...ticket,
    status,
    department: meta.department,
    assignee,
    location,
    serviceLabel: meta.serviceLabel,
    sla: meta.sla,
    createdAt,
    updatedAt: ticket.updatedAt || createdAt,
    requesterName: ticket.requesterName || 'Guest User',
    requesterEmail: ticket.requesterEmail || 'guest@umt.edu.my',
    comments: ticket.comments?.length ? ticket.comments : buildComments(status, assignee),
  }
}

function notifyAction(message) {
  window.alert(message)
}

function App() {
  const [tickets, setTickets] = useState([])
  const [query, setQuery] = useState('')
  const [activeNav, setActiveNav] = useState('operations')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [draftComment, setDraftComment] = useState('')
  const [form, setForm] = useState(initialForm)
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) || '')
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [submitNotice, setSubmitNotice] = useState('')
  const [loginForm, setLoginForm] = useState({
    login: '',
    password: '',
  })
  const [users, setUsers] = useState([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [userNotice, setUserNotice] = useState('')
  const [userForm, setUserForm] = useState(initialUserForm)
  const [editingUserId, setEditingUserId] = useState(null)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState(null)
  const [assigneeUsers, setAssigneeUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [categoriesError, setCategoriesError] = useState('')
  const [categoryNotice, setCategoryNotice] = useState('')
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState(null)
  const [temporaryRole, setTemporaryRole] = useState('')

  const effectiveRole = temporaryRole || currentUser?.role || ''

  const navItems =
    effectiveRole === 'ADMIN'
      ? [...staffNavItems, ...adminOnlyNavItems]
      : effectiveRole === 'STAFF'
        ? staffNavItems
        : effectiveRole === 'ASSIGNEE'
          ? assigneeNavItems
      : basicAccessNavItems

  const categoryMeta = categories.length
    ? Object.fromEntries(
        categories.map((category) => [
          category.name,
          {
            department: category.department,
            assignees: fallbackCategoryMeta[category.name]?.assignees || [],
            serviceLabel: category.serviceLabel,
            location: category.defaultLocation,
            sla: category.responseTarget,
          },
        ]),
      )
    : fallbackCategoryMeta
  const categoryOptions = Object.keys(categoryMeta)

  useEffect(() => {
    void fetchCategories()
  }, [])

  useEffect(() => {
    void bootstrapAuth()
  }, [])

  useEffect(() => {
    if (!token) {
      setTickets([])
      setCurrentUser(null)
      setIsAuthenticating(false)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    localStorage.setItem(AUTH_STORAGE_KEY, token)
  }, [token])

  useEffect(() => {
    if (!navItems.length) {
      return
    }

    const currentNavIsValid = navItems.some((item) => item.key === activeNav)
    if (!currentNavIsValid) {
      setActiveNav(navItems[0].key)
    }
  }, [activeNav, navItems])

  useEffect(() => {
    if (!tickets.length) {
      return
    }

    const selectedExists = tickets.some((ticket) => ticket.id === selectedTicketId)
    if (!selectedExists) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [selectedTicketId, tickets])

  useEffect(() => {
    if (activeNav !== 'user-management' || currentUser?.role !== 'ADMIN' || !token) {
      return
    }

    void fetchUsers()
  }, [activeNav, currentUser?.role, token])

  useEffect(() => {
    if (!currentUser) {
      setTemporaryRole('')
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      requesterName: currentForm.requesterName || currentUser.username || '',
      requesterEmail: currentForm.requesterEmail || currentUser.email || '',
    }))
  }, [currentUser])

  useEffect(() => {
    if (!categoryOptions.length) {
      return
    }

    setForm((currentForm) => {
      if (currentForm.category && categoryOptions.includes(currentForm.category)) {
        return currentForm
      }

      return {
        ...currentForm,
        category: categoryOptions[0],
      }
    })
  }, [categoryOptions])

  useEffect(() => {
    if (!categories.length || !tickets.length) {
      return
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket, index) => enrichTicket(ticket, index, categoryMeta)),
    )
  }, [categories])

  useEffect(() => {
    if (!token || !isOperationsRole(currentUser?.role)) {
      return
    }

    void fetchAssigneeUsers()
  }, [token, currentUser?.role])

  async function fetchCategories() {
    try {
      setIsCategoriesLoading(true)
      setCategoriesError('')

      const response = await fetch(CATEGORY_API_URL)
      if (!response.ok) {
        throw new Error(`Failed to load departments: ${response.status}`)
      }

      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (categoryError) {
      setCategories([])
      setCategoriesError(categoryError.message || 'Unable to load departments.')
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  async function fetchTickets() {
    try {
      setIsLoading(true)
      setError('')
      setIsDemoMode(false)

      const response = await fetch(API_URL, {
        headers: authHeaders(),
      })
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }
        throw new Error(`Failed to fetch tickets: ${response.status}`)
      }

      const data = await response.json()
      const normalizedTickets = (Array.isArray(data) ? data : []).map((ticket, index) =>
        enrichTicket(ticket, index, categoryMeta),
      )

      const availableTickets = normalizedTickets.length
        ? normalizedTickets
        : demoTickets.map((ticket, index) => enrichTicket(ticket, index, categoryMeta))

      setTickets(availableTickets)
      setSelectedTicketId(availableTickets[0]?.id ?? null)
      setIsDemoMode(!normalizedTickets.length)
    } catch (fetchError) {
      const fallbackTickets = demoTickets.map((ticket, index) => enrichTicket(ticket, index, categoryMeta))
      setTickets(fallbackTickets)
      setSelectedTicketId(fallbackTickets[0]?.id ?? null)
      setIsDemoMode(true)
      setError(fetchError.message || 'Unable to load tickets.')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUsers() {
    try {
      setIsUsersLoading(true)
      setUsersError('')

      const response = await fetch(USER_API_URL, {
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        if (response.status === 403) {
          throw new Error('Admin access is required to manage users.')
        }

        throw new Error(`Failed to load users: ${response.status}`)
      }

      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (fetchError) {
      setUsersError(fetchError.message || 'Unable to load users.')
    } finally {
      setIsUsersLoading(false)
    }
  }

  async function fetchAssigneeUsers() {
    try {
      const response = await fetch(ASSIGNEE_API_URL, {
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(`Failed to load assignees: ${response.status}`)
      }

      const data = await response.json()
      setAssigneeUsers(Array.isArray(data) ? data : [])
    } catch (assigneeError) {
      console.error(assigneeError)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      requesterName: form.requesterName.trim(),
      requesterEmail: form.requesterEmail.trim(),
      title: form.title,
      category: form.category,
      description: form.description,
      status: 'OPEN',
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }
        throw new Error(`Failed to create ticket: ${response.status}`)
      }

      const createdTicket = enrichTicket(await response.json(), 0, categoryMeta)

      if (isOperationsRole(currentUser?.role)) {
        setTickets((currentTickets) => [createdTicket, ...currentTickets])
        setSelectedTicketId(createdTicket.id)
        setActiveNav('ticket-management')
      }

      setIsDemoMode(false)
      const message = `Ticket SCSS-${createdTicket.id ?? 'NEW'} submitted successfully.`
      setSubmitNotice(message)
      notifyAction(message)
      setForm(initialForm)
      setIsModalOpen(false)
    } catch (submitError) {
      const localTicket = enrichTicket(
        {
          id: Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
        },
        0,
        categoryMeta,
      )

      if (isOperationsRole(currentUser?.role)) {
        setTickets((currentTickets) => [localTicket, ...currentTickets])
        setSelectedTicketId(localTicket.id)
        setActiveNav('ticket-management')
      }

      setIsDemoMode(true)
      setError('Backend create endpoint is unavailable. Ticket added in interface demo mode.')
      const message = `Ticket SCSS-${localTicket.id} submitted in demo mode.`
      setSubmitNotice(message)
      notifyAction(message)
      setForm(initialForm)
      setIsModalOpen(false)
      console.error(submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  function upsertTicket(ticket) {
    const normalizedTicket = enrichTicket(ticket, 0, categoryMeta)

    setTickets((currentTickets) => {
      const exists = currentTickets.some((currentTicket) => currentTicket.id === normalizedTicket.id)
      const nextTickets = exists
        ? currentTickets.map((currentTicket) =>
            currentTicket.id === normalizedTicket.id ? normalizedTicket : currentTicket,
          )
        : [normalizedTicket, ...currentTickets]

      return nextTickets.sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
    })
  }

  async function handleStatusChange(ticketId, status) {
    try {
      setError('')

      const response = await fetch(`${API_URL}/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(await parseErrorMessage(response, 'Failed to update ticket status.'))
      }

      upsertTicket(await response.json())
      setIsDemoMode(false)
      notifyAction(`Ticket status updated to ${getStatusLabel(status)}.`)
    } catch (statusError) {
      const message = statusError.message || 'Unable to update ticket status.'
      setError(message)
      notifyAction(message)
    }
  }

  async function handleAssigneeChange(ticketId, assignee) {
    try {
      setError('')

      const response = await fetch(`${API_URL}/${ticketId}/assignee`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignee }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(await parseErrorMessage(response, 'Failed to update ticket assignee.'))
      }

      upsertTicket(await response.json())
      setIsDemoMode(false)
      notifyAction(`Ticket assigned to ${assignee}.`)
    } catch (assignmentError) {
      const message = assignmentError.message || 'Unable to update ticket assignee.'
      setError(message)
      notifyAction(message)
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault()

    if (!draftComment.trim() || !selectedTicketId) {
      return
    }

    try {
      setError('')

      const response = await fetch(`${API_URL}/${selectedTicketId}/comments`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: draftComment.trim(),
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(await parseErrorMessage(response, 'Failed to add ticket comment.'))
      }

      upsertTicket(await response.json())
      setDraftComment('')
      setIsDemoMode(false)
      notifyAction('Ticket comment added successfully.')
    } catch (commentError) {
      const message = commentError.message || 'Unable to add ticket comment.'
      setError(message)
      notifyAction(message)
    }
  }

  async function bootstrapAuth() {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedToken) {
      setIsAuthenticating(false)
      return
    }

    try {
      setIsAuthenticating(true)
      const response = await fetch(`${AUTH_URL}/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Auth bootstrap failed: ${response.status}`)
      }

      const user = await response.json()
      setToken(storedToken)
      setCurrentUser(user)
      if (isOperationsRole(user.role)) {
        await fetchTicketsWithToken(storedToken)
      } else if (isAssigneeRole(user.role)) {
        setActiveNav('assigned-tickets')
        await fetchAssignedTicketsWithToken(storedToken)
      } else {
        setTickets([])
        setSelectedTicketId(null)
        setIsDemoMode(false)
      }
    } catch (bootstrapError) {
      console.error(bootstrapError)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setToken('')
      setCurrentUser(null)
      setAuthError('Please log in with a valid system account.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()

    try {
      setIsLoggingIn(true)
      setAuthError('')

      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid login credentials.')
        }

        if (response.status === 403) {
          throw new Error('This account is not allowed to sign in.')
        }

        throw new Error(`Login failed: ${response.status}`)
      }

      const authPayload = await response.json()
      setToken(authPayload.token)
      setCurrentUser(authPayload)
      setLoginForm({
        login: '',
        password: '',
      })
      if (isOperationsRole(authPayload.role)) {
        await fetchTicketsWithToken(authPayload.token)
      } else if (isAssigneeRole(authPayload.role)) {
        setActiveNav('assigned-tickets')
        await fetchAssignedTicketsWithToken(authPayload.token)
      } else {
        setTickets([])
        setSelectedTicketId(null)
        setIsDemoMode(false)
        setActiveNav('operations')
      }
    } catch (loginError) {
      setAuthError(loginError.message || 'Unable to sign in.')
    } finally {
      setIsLoggingIn(false)
      setIsAuthenticating(false)
    }
  }

  async function handleLogout() {
    try {
      if (token) {
        await fetch(`${AUTH_URL}/logout`, {
          method: 'POST',
          headers: authHeaders(),
        })
      }
    } catch (logoutError) {
      console.error(logoutError)
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setToken('')
      setCurrentUser(null)
      setTickets([])
      setSelectedTicketId(null)
      setAuthError('')
      setError('')
      setSubmitNotice('')
      setQuery('')
      setUsers([])
      setUsersError('')
      setUserNotice('')
      setUserForm(initialUserForm)
      setEditingUserId(null)
      setTemporaryRole('')
    }
  }

  async function fetchTicketsWithToken(authToken) {
    try {
      setIsLoading(true)
      setError('')
      setIsDemoMode(false)

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(`Failed to fetch tickets: ${response.status}`)
      }

      const data = await response.json()
      const normalizedTickets = (Array.isArray(data) ? data : []).map((ticket, index) =>
        enrichTicket(ticket, index, categoryMeta),
      )

      const availableTickets = normalizedTickets.length
        ? normalizedTickets
        : demoTickets.map((ticket, index) => enrichTicket(ticket, index, categoryMeta))

      setTickets(availableTickets)
      setSelectedTicketId(availableTickets[0]?.id ?? null)
      setIsDemoMode(!normalizedTickets.length)
    } catch (fetchError) {
      const fallbackTickets = demoTickets.map((ticket, index) => enrichTicket(ticket, index, categoryMeta))
      setTickets(fallbackTickets)
      setSelectedTicketId(fallbackTickets[0]?.id ?? null)
      setIsDemoMode(true)
      setError(fetchError.message || 'Unable to load tickets.')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchAssignedTicketsWithToken(authToken) {
    try {
      setIsLoading(true)
      setError('')
      setIsDemoMode(false)

      const response = await fetch(ASSIGNED_TICKETS_URL, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(`Failed to fetch assigned tickets: ${response.status}`)
      }

      const data = await response.json()
      const normalizedTickets = (Array.isArray(data) ? data : []).map((ticket, index) =>
        enrichTicket(ticket, index, categoryMeta),
      )

      setTickets(normalizedTickets)
      setSelectedTicketId(normalizedTickets[0]?.id ?? null)
    } catch (fetchError) {
      setTickets([])
      setSelectedTicketId(null)
      setError(fetchError.message || 'Unable to load assigned tickets.')
    } finally {
      setIsLoading(false)
    }
  }

  function authHeaders() {
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}
  }

  function handleUnauthorized(message) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setToken('')
    setCurrentUser(null)
    setTickets([])
    setSelectedTicketId(null)
    setAuthError(message)
    setIsAuthenticating(false)
    setUsers([])
    setAssigneeUsers([])
    setUsersError('')
    setUserNotice('')
    setTemporaryRole('')
  }

  function resetUserForm() {
    setUserForm(initialUserForm)
    setEditingUserId(null)
  }

  function resetCategoryForm() {
    setCategoryForm(initialCategoryForm)
    setEditingCategoryId(null)
  }

  function beginEditUser(user) {
    setEditingUserId(user.id)
    setUserNotice('')
    setUsersError('')
    setUserForm({
      username: user.username ?? '',
      email: user.email ?? '',
      password: '',
      role: user.role ?? 'STAFF',
    })
  }

  function beginEditCategory(category) {
    setEditingCategoryId(category.id)
    setCategoryNotice('')
    setCategoriesError('')
    setCategoryForm({
      name: category.name ?? '',
      department: category.department ?? '',
      serviceLabel: category.serviceLabel ?? '',
      defaultLocation: category.defaultLocation ?? '',
      responseTarget: category.responseTarget ?? '',
    })
  }

  async function handleUserSubmit(event) {
    event.preventDefault()

    const trimmedUsername = userForm.username.trim()
    const trimmedEmail = userForm.email.trim()
    const trimmedPassword = userForm.password.trim()

    if (!trimmedUsername || !trimmedEmail) {
      setUsersError('Username and email are required.')
      return
    }

    if (!editingUserId && trimmedPassword.length < 8) {
      setUsersError('Password must be at least 8 characters.')
      return
    }

    if (editingUserId && trimmedPassword && trimmedPassword.length < 8) {
      setUsersError('Password must be at least 8 characters.')
      return
    }

    const payload = {
      username: trimmedUsername,
      email: trimmedEmail,
      role: userForm.role,
    }

    if (!editingUserId || trimmedPassword) {
      payload.password = trimmedPassword
    }

    try {
      setIsSavingUser(true)
      setUsersError('')
      setUserNotice('')

      const response = await fetch(
        editingUserId ? `${USER_API_URL}/${editingUserId}` : USER_API_URL,
        {
          method: editingUserId ? 'PUT' : 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        const message = await parseErrorMessage(
          response,
          editingUserId ? 'Failed to update user.' : 'Failed to create user.',
        )
        throw new Error(message)
      }

      const savedUser = await response.json()

      setUsers((currentUsers) => {
        if (editingUserId) {
          return currentUsers
            .map((user) => (user.id === savedUser.id ? savedUser : user))
            .sort((left, right) => left.username.localeCompare(right.username))
        }

        return [...currentUsers, savedUser].sort((left, right) =>
          left.username.localeCompare(right.username),
        )
      })

      const message = editingUserId
        ? `User ${savedUser.username} updated successfully.`
        : `User ${savedUser.username} created successfully.`
      setUserNotice(message)
      notifyAction(message)
      await fetchAssigneeUsers()
      resetUserForm()
    } catch (saveError) {
      const message = saveError.message || 'Unable to save user.'
      setUsersError(message)
      notifyAction(
        message.includes('already in use') ? `User update blocked: ${message}` : message,
      )
    } finally {
      setIsSavingUser(false)
    }
  }

  async function handleDeleteUser(user) {
    const confirmed = window.confirm(
      `Delete user "${user.username}" (${user.role})? This action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingUserId(user.id)
      setUsersError('')
      setUserNotice('')

      const response = await fetch(`${USER_API_URL}/${user.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        const message = await parseErrorMessage(response, 'Failed to delete user.')
        throw new Error(message)
      }

      setUsers((currentUsers) => currentUsers.filter((currentUserItem) => currentUserItem.id !== user.id))
      const message = `User ${user.username} deleted successfully.`
      setUserNotice(message)
      notifyAction(message)
      await fetchAssigneeUsers()

      if (editingUserId === user.id) {
        resetUserForm()
      }
    } catch (deleteError) {
      const message = deleteError.message || 'Unable to delete user.'
      setUsersError(message)
      notifyAction(message)
    } finally {
      setDeletingUserId(null)
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault()

    const payload = {
      name: categoryForm.name.trim(),
      department: categoryForm.department.trim(),
      serviceLabel: categoryForm.serviceLabel.trim(),
      defaultLocation: categoryForm.defaultLocation.trim(),
      responseTarget: categoryForm.responseTarget.trim(),
    }

    if (
      !payload.name ||
      !payload.department ||
      !payload.serviceLabel ||
      !payload.defaultLocation ||
      !payload.responseTarget
    ) {
      setCategoriesError('All department fields are required.')
      return
    }

    try {
      setIsSavingCategory(true)
      setCategoriesError('')
      setCategoryNotice('')

      const response = await fetch(
        editingCategoryId ? `${CATEGORY_API_URL}/${editingCategoryId}` : CATEGORY_API_URL,
        {
          method: editingCategoryId ? 'PUT' : 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(
          await parseErrorMessage(
            response,
            editingCategoryId ? 'Failed to update department.' : 'Failed to create department.',
          ),
        )
      }

      const savedCategory = await response.json()
      setCategories((currentCategories) => {
        const exists = currentCategories.some((category) => category.id === savedCategory.id)
        const nextCategories = exists
          ? currentCategories.map((category) =>
              category.id === savedCategory.id ? savedCategory : category,
            )
          : [...currentCategories, savedCategory]

        return nextCategories.sort((left, right) => left.name.localeCompare(right.name))
      })
      const message = editingCategoryId
        ? `Department ${savedCategory.name} updated successfully.`
        : `Department ${savedCategory.name} created successfully.`
      setCategoryNotice(message)
      notifyAction(message)
      resetCategoryForm()
    } catch (saveError) {
      const message = saveError.message || 'Unable to save department.'
      setCategoriesError(message)
      notifyAction(message)
    } finally {
      setIsSavingCategory(false)
    }
  }

  async function handleDeleteCategory(category) {
    const confirmed = window.confirm(
      `Delete department "${category.name}"? This action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingCategoryId(category.id)
      setCategoriesError('')
      setCategoryNotice('')

      const response = await fetch(`${CATEGORY_API_URL}/${category.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized('Your session has expired. Please log in again.')
          return
        }

        throw new Error(await parseErrorMessage(response, 'Failed to delete department.'))
      }

      setCategories((currentCategories) =>
        currentCategories.filter((currentCategory) => currentCategory.id !== category.id),
      )
      const message = `Department ${category.name} deleted successfully.`
      setCategoryNotice(message)
      notifyAction(message)

      if (editingCategoryId === category.id) {
        resetCategoryForm()
      }
    } catch (deleteError) {
      const message = deleteError.message || 'Unable to delete department.'
      setCategoriesError(message)
      notifyAction(message)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  async function parseErrorMessage(response, fallbackMessage) {
    try {
      const text = await response.text()

      if (!text) {
        return fallbackMessage
      }

      try {
        const parsed = JSON.parse(text)
        return parsed.detail || parsed.message || parsed.error || fallbackMessage
      } catch {
        return text
      }
    } catch {
      return fallbackMessage
    }
  }

  const normalizedQuery = query.trim().toLowerCase()

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter
    const searchable = [
      `SCSS-${ticket.id ?? 'NEW'}`,
      ticket.title ?? '',
      ticket.category ?? '',
      ticket.status ?? '',
      ticket.department ?? '',
      ticket.assignee ?? '',
      ticket.location ?? '',
    ]
    const matchesQuery = normalizedQuery
      ? searchable.some((value) => value.toLowerCase().includes(normalizedQuery))
      : true

    if (activeNav === 'ticket-management') {
      return matchesStatus && matchesQuery
    }

    return matchesQuery
  })

  const filteredUsers = users.filter((user) => {
    const searchable = [user.username ?? '', user.email ?? '', user.role ?? '', String(user.id ?? '')]

    return normalizedQuery
      ? searchable.some((value) => value.toLowerCase().includes(normalizedQuery))
      : true
  })

  const filteredAssignees = assigneeUsers.filter((user) => {
    const searchable = [user.username ?? '', user.email ?? '', user.role ?? '', String(user.id ?? '')]

    return normalizedQuery
      ? searchable.some((value) => value.toLowerCase().includes(normalizedQuery))
      : true
  })

  const filteredCategories = categories.filter((category) => {
    const searchable = [
      category.name ?? '',
      category.department ?? '',
      category.serviceLabel ?? '',
      category.defaultLocation ?? '',
      category.responseTarget ?? '',
    ]

    return normalizedQuery
      ? searchable.some((value) => value.toLowerCase().includes(normalizedQuery))
      : true
  })

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) || filteredTickets[0] || tickets[0] || null

  const total = tickets.length
  const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED').length
  const inProgress = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length
  const openCount = tickets.filter((ticket) => ticket.status === 'OPEN').length
  const unassignedTickets = tickets.filter((ticket) => !ticket.assignee || ticket.assignee === 'Unassigned')
  const unassignedOpenTickets = unassignedTickets.filter((ticket) => ticket.status === 'OPEN')
  const activeAssignedTickets = tickets.filter(
    (ticket) =>
      ticket.assignee &&
      ticket.assignee !== 'Unassigned' &&
      (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'),
  )
  const resolvedToday = tickets.filter((ticket) => {
    if (ticket.status !== 'RESOLVED' || !ticket.updatedAt) {
      return false
    }

    const updatedAt = new Date(ticket.updatedAt)
    const now = new Date()
    return (
      updatedAt.getFullYear() === now.getFullYear() &&
      updatedAt.getMonth() === now.getMonth() &&
      updatedAt.getDate() === now.getDate()
    )
  })
  const staleOpenTickets = tickets.filter((ticket) => {
    if (ticket.status !== 'OPEN' || !ticket.createdAt) {
      return false
    }

    const createdAt = new Date(ticket.createdAt).getTime()
    return Date.now() - createdAt >= 1000 * 60 * 60 * 24
  })
  const dispatchPreviewTickets = [...unassignedOpenTickets]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
  const recentResolvedTickets = [...resolvedToday]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 4)
  const assigneeWorkload = Object.entries(
    activeAssignedTickets.reduce((workload, ticket) => {
      const assignee = ticket.assignee || 'Unassigned'
      workload[assignee] = (workload[assignee] || 0) + 1
      return workload
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 5)

  const stats = [
    {
      label: 'Open',
      value: openCount,
      icon: Clock3,
      accent: 'bg-[#003366] text-white',
      note: 'Tickets waiting for action',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Wrench,
      accent: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      note: 'Tickets currently being handled',
    },
    {
      label: 'Resolved',
      value: resolved,
      icon: CheckCircle2,
      accent: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      note: 'Tickets completed by support staff',
    },
  ]
  const staffStats = [
    {
      label: 'Needs Dispatch',
      value: unassignedOpenTickets.length,
      icon: AlertCircle,
      accent: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      note: 'Open tickets still waiting for assignment',
    },
    {
      label: 'Active Assignments',
      value: activeAssignedTickets.length,
      icon: Users,
      accent: 'bg-[#003366] text-white',
      note: 'Open or in-progress tickets already routed',
    },
    {
      label: 'Resolved Today',
      value: resolvedToday.length,
      icon: CheckCircle2,
      accent: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      note: 'Tickets moved to resolved status today',
    },
    {
      label: 'Stale Open',
      value: staleOpenTickets.length,
      icon: Clock3,
      accent: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      note: 'Open tickets older than one day',
    },
  ]

  const panelTitleMap = {
    'report-issue': 'Create ticket',
    operations: effectiveRole === 'STAFF' ? 'Staff dashboard' : 'Admin dashboard',
    'assigned-tickets': 'Assigned tickets',
    'ticket-management': 'Ticket management',
    'assignee-management': 'Assignee management',
    'user-management': 'User management',
    'category-management': 'Department management',
  }

  const panelTitle = panelTitleMap[activeNav] || 'Smart Campus Support System'
  const searchPlaceholder =
    activeNav === 'user-management'
      ? 'Search users by username, email, role, or ID'
      : activeNav === 'assignee-management'
        ? 'Search assignees by username, email, or ID'
      : activeNav === 'category-management'
        ? 'Search departments, service labels, or locations'
      : 'Search tickets, departments, assignees, or locations'

  const selectedAssigneeOptions = assigneeUsers.length
    ? assigneeUsers.map((user) => user.username)
    : selectedTicket && categoryMeta[selectedTicket.category]
      ? categoryMeta[selectedTicket.category].assignees
      : categoryMeta['Facilities'].assignees

  function openDispatchQueue(targetTicketId = null) {
    setStatusFilter('OPEN')
    setQuery('')
    setActiveNav('ticket-management')

    const fallbackTicketId = unassignedOpenTickets[0]?.id ?? null
    const nextTicketId = targetTicketId ?? fallbackTicketId
    if (nextTicketId) {
      setSelectedTicketId(nextTicketId)
    }
  }

  function openCreateModal() {
    setSubmitNotice('')
    setIsModalOpen(true)
    setActiveNav('report-issue')
  }

  function handleSelectNav(key) {
    setActiveNav(key)
    setIsSidebarOpen(false)

    if (key === 'report-issue') {
      setIsModalOpen(true)
    }
  }

  function handleTemporaryRoleChange(nextRole) {
    setTemporaryRole(nextRole)
    setQuery('')
    setIsSidebarOpen(false)

    if (nextRole === 'ADMIN') {
      setActiveNav('operations')
      return
    }

    if (nextRole === 'STAFF') {
      setActiveNav('operations')
      return
    }

    if (nextRole === 'ASSIGNEE') {
      setActiveNav('assigned-tickets')
      return
    }

    setActiveNav('operations')
  }

  function renderOverviewCards() {
    const dashboardStats = effectiveRole === 'STAFF' ? staffStats : stats

    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon

          return (
            <article
              key={stat.label}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{stat.note}</p>
                </div>
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${stat.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          )
        })}
      </section>
    )
  }

  function renderStaffDashboard() {
    return (
      <>
        {renderOverviewCards()}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Dispatch pressure</h2>
                <p className="mt-1 text-sm text-slate-500">
                  New tickets waiting for staff review, assignment, or escalation.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {dispatchPreviewTickets.length ? (
                dispatchPreviewTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => openDispatchQueue(ticket.id)}
                    className="flex w-full items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{ticket.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        SCSS-{ticket.id} • {ticket.category}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{ticket.department}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                        Unassigned
                      </span>
                      <p className="mt-2 text-xs text-slate-500">{formatDateTime(ticket.createdAt)}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">Dispatch queue is clear</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    There are no open tickets waiting for assignment right now.
                  </p>
                </div>
              )}
            </div>
          </article>

          <div className="space-y-6">
            <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Assignee workload</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Current active load across assigned tickets.
                  </p>
                </div>
                <Users className="h-5 w-5 text-[#003366]" />
              </div>

              <div className="mt-5 space-y-3">
                {assigneeWorkload.length ? (
                  assigneeWorkload.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{entry.name}</p>
                        <p className="mt-1 text-sm text-slate-500">Active assigned tickets</p>
                      </div>
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-[#003366] px-3 text-sm font-semibold text-white">
                        {entry.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <h3 className="text-lg font-semibold text-slate-900">No active assignments</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Assign tickets from the main queue to populate assignee workload.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Resolved today</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Quick confirmation of tickets closed out by the team today.
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="mt-5 space-y-3">
                {recentResolvedTickets.length ? (
                  recentResolvedTickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-3xl bg-slate-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950">{ticket.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {ticket.assignee} • SCSS-{ticket.id}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          Resolved
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Updated {formatDateTime(ticket.updatedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <h3 className="text-lg font-semibold text-slate-900">No resolutions yet</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Tickets resolved today will appear here for quick review.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      </>
    )
  }

  function renderManagementPage() {
    return (
      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Ticket management</h2>
              <p className="mt-1 text-sm text-slate-500">
                View all tickets and review full ticket details from one queue.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Filter className="h-4 w-4" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="bg-transparent outline-none"
                >
                  <option value="ALL">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-[#003366]"
              >
                <Plus className="h-4 w-4" />
                New Ticket
              </button>
            </div>
          </div>

          <TicketTable
            isLoading={isLoading}
            selectedTicketId={selectedTicket?.id ?? null}
            tickets={filteredTickets}
            onSelectTicket={setSelectedTicketId}
          />
        </div>

        <TicketDetailsPanel
          mode="management"
          commentValue={draftComment}
          onAssigneeChange={handleAssigneeChange}
          onCommentChange={setDraftComment}
          onCommentSubmit={handleCommentSubmit}
          onStatusChange={handleStatusChange}
          selectedAssigneeOptions={selectedAssigneeOptions}
          ticket={selectedTicket}
        />
      </section>
    )
  }

  function renderAssignedTicketsPage() {
    return (
      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Assigned tickets</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the tickets assigned to you and keep work progress up to date.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Filter className="h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="ALL">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <TicketTable
            isLoading={isLoading}
            selectedTicketId={selectedTicket?.id ?? null}
            tickets={filteredTickets}
            onSelectTicket={setSelectedTicketId}
          />
        </div>

        <TicketDetailsPanel
          mode="status-comments"
          commentValue={draftComment}
          onAssigneeChange={handleAssigneeChange}
          onCommentChange={setDraftComment}
          onCommentSubmit={handleCommentSubmit}
          onStatusChange={handleStatusChange}
          selectedAssigneeOptions={selectedAssigneeOptions}
          ticket={selectedTicket}
        />
      </section>
    )
  }

  function renderUserManagementPage() {
    const editingUser = users.find((user) => user.id === editingUserId) ?? null

    return (
      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">User management</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create, edit, and remove admin, staff, and assignee accounts.
              </p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003366] text-white">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Accounts</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {users.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Total users currently available in the system.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Admins</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {users.filter((user) => user.role === 'ADMIN').length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Privileged accounts with dashboard, ticket, and user access.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Filtered results</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {filteredUsers.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Results matching the current search query.
              </p>
            </article>
          </div>

          {userNotice ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {userNotice}
            </div>
          ) : null}

          {usersError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {usersError}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      User
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Email
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Role
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isUsersLoading ? (
                    <tr>
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan="4">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-950">{user.username}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                            ID {user.id}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => beginEditUser(user)}
                              className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-[#003366]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              disabled={deletingUserId === user.id}
                              className="inline-flex h-9 items-center justify-center rounded-2xl border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan="4">
                        No users match the current search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {editingUser ? `Edit ${editingUser.username}` : 'Create user'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingUser
                  ? 'Update account identity, role, or password. Leave password blank to keep the current one.'
                  : 'Add a new account and assign the correct role for access control.'}
              </p>
            </div>
            <button
              type="button"
              onClick={resetUserForm}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {editingUser ? 'Cancel edit' : 'Reset'}
            </button>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleUserSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="user-username">
                Username
              </label>
              <input
                id="user-username"
                type="text"
                required
                value={userForm.username}
                onChange={(event) =>
                  setUserForm((currentForm) => ({
                    ...currentForm,
                    username: event.target.value,
                  }))
                }
                placeholder="Enter username"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="user-email">
                Email
              </label>
              <input
                id="user-email"
                type="email"
                required
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((currentForm) => ({
                    ...currentForm,
                    email: event.target.value,
                  }))
                }
                placeholder="name@umt.edu.my"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="user-password">
                  Password
                </label>
                <input
                  id="user-password"
                  type="password"
                  minLength={editingUserId ? undefined : 8}
                  required={!editingUserId}
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({
                      ...currentForm,
                      password: event.target.value,
                    }))
                  }
                  placeholder={editingUserId ? 'Leave blank to keep current password' : 'Set password'}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="user-role">
                  Role
                </label>
                <select
                  id="user-role"
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({
                      ...currentForm,
                      role: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                >
                  {userRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Access summary
              </p>
              <p className="mt-2 text-sm text-slate-600">
                `ADMIN` can manage users and tickets. `STAFF` can manage tickets. `ASSIGNEE`
                appears in the ticket assignee dropdown and assigned work queue.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Passwords must be at least 8 characters.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetUserForm}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSavingUser}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingUser
                  ? editingUserId
                    ? 'Saving...'
                    : 'Creating...'
                  : editingUserId
                    ? 'Save Changes'
                    : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </section>
    )
  }

  function renderAssigneeManagementPage() {
    const assigneeWorkloadMap = activeAssignedTickets.reduce((workload, ticket) => {
      const assignee = ticket.assignee || 'Unassigned'
      workload[assignee] = (workload[assignee] || 0) + 1
      return workload
    }, {})

    const assigneeInsights = filteredAssignees.map((assignee) => {
      const totalTickets = tickets.filter((ticket) => ticket.assignee === assignee.username).length
      const activeTickets = assigneeWorkloadMap[assignee.username] || 0
      const openTickets = tickets.filter(
        (ticket) =>
          ticket.assignee === assignee.username &&
          (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'),
      ).length

      return {
        ...assignee,
        activeTickets,
        openTickets,
        totalTickets,
      }
    })

    const busiestAssignee =
      [...assigneeInsights].sort((left, right) => right.activeTickets - left.activeTickets)[0] ||
      null

    const openRoutedTickets = tickets.filter(
      (ticket) => ticket.assignee && ticket.assignee !== 'Unassigned' && ticket.status === 'OPEN',
    ).length

    return (
      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Assignee management</h2>
              <p className="mt-1 text-sm text-slate-500">
                Monitor assignee accounts, current workload, and ticket routing pressure.
              </p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003366] text-white">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Assignees</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {assigneeUsers.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Total assignee accounts available for routing.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Open routed</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {openRoutedTickets}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tickets already assigned and still waiting on action.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Filtered results</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {assigneeInsights.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Results matching the current search query.
              </p>
            </article>
          </div>

          {busiestAssignee ? (
            <div className="mt-6 rounded-3xl border border-[#003366]/10 bg-[#003366]/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003366]/70">
                Current busiest assignee
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{busiestAssignee.username}</p>
              <p className="mt-1 text-sm text-slate-600">
                {busiestAssignee.activeTickets} active tickets, {busiestAssignee.openTickets} open tickets.
              </p>
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Assignee
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Active
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Open
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Total
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isUsersLoading ? (
                    <tr>
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                        Loading assignees...
                      </td>
                    </tr>
                  ) : assigneeInsights.length ? (
                    assigneeInsights.map((assignee) => (
                      <tr key={assignee.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-950">{assignee.username}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                            {assignee.email}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{assignee.activeTickets}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{assignee.openTickets}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{assignee.totalTickets}</td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              setQuery(assignee.username)
                              setStatusFilter('ALL')
                              setActiveNav('ticket-management')
                              const firstTicket =
                                tickets.find((ticket) => ticket.assignee === assignee.username) || null
                              if (firstTicket) {
                                setSelectedTicketId(firstTicket.id)
                              }
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-[#003366]"
                          >
                            View tickets
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                        No assignees match the current search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Assignment summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Operational load by assignee, based on tickets currently in the system.
              </p>
            </div>
            <Users className="h-5 w-5 text-[#003366]" />
          </div>

          <div className="mt-6 space-y-3">
            {assigneeWorkloadMap && Object.keys(assigneeWorkloadMap).length ? (
              Object.entries(assigneeWorkloadMap)
                .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
                .slice(0, 6)
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{name}</p>
                      <p className="mt-1 text-sm text-slate-500">Active assigned tickets</p>
                    </div>
                    <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-[#003366] px-3 text-sm font-semibold text-white">
                      {count}
                    </span>
                  </div>
                ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">No active load</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Assign tickets to assignees to populate the workload summary.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  function renderCategoryManagementPage() {
    const editingCategory = categories.find((category) => category.id === editingCategoryId) ?? null

    return (
      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Department management</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage support departments, routing, service labels, locations, and response targets.
              </p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003366] text-white">
              <Wrench className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Departments</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {categories.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Total managed departments available for routing.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Departments</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {new Set(categories.map((category) => category.department)).size}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Distinct departments currently mapped to routing.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Filtered results</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {filteredCategories.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Results matching the current search query.
              </p>
            </article>
          </div>

          {categoryNotice ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {categoryNotice}
            </div>
          ) : null}

          {categoriesError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {categoriesError}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Department
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Department
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Location
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Target
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isCategoriesLoading ? (
                    <tr>
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                        Loading departments...
                      </td>
                    </tr>
                  ) : filteredCategories.length ? (
                    filteredCategories.map((category) => (
                      <tr key={category.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-950">{category.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                            {category.serviceLabel}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{category.department}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{category.defaultLocation}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{category.responseTarget}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => beginEditCategory(category)}
                              className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-[#003366]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category)}
                              disabled={deletingCategoryId === category.id}
                              className="inline-flex h-9 items-center justify-center rounded-2xl border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {deletingCategoryId === category.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan="5">
                        No departments match the current search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {editingCategory ? `Edit ${editingCategory.name}` : 'Create department'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure how ticket requests are routed and described across the system.
              </p>
            </div>
            <button
              type="button"
              onClick={resetCategoryForm}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {editingCategory ? 'Cancel edit' : 'Reset'}
            </button>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleCategorySubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="category-name">
                Department name
              </label>
              <input
                id="category-name"
                type="text"
                required
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((currentForm) => ({
                    ...currentForm,
                    name: event.target.value,
                  }))
                }
                placeholder="Example: IT Support"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="category-department">
                Department
              </label>
              <input
                id="category-department"
                type="text"
                required
                value={categoryForm.department}
                onChange={(event) =>
                  setCategoryForm((currentForm) => ({
                    ...currentForm,
                    department: event.target.value,
                  }))
                }
                placeholder="Example: Information Technology Centre"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="category-service-label">
                  Service label
                </label>
                <input
                  id="category-service-label"
                  type="text"
                  required
                  value={categoryForm.serviceLabel}
                  onChange={(event) =>
                    setCategoryForm((currentForm) => ({
                      ...currentForm,
                      serviceLabel: event.target.value,
                    }))
                  }
                  placeholder="Example: Network & systems"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="category-response-target">
                  Response target
                </label>
                <input
                  id="category-response-target"
                  type="text"
                  required
                  value={categoryForm.responseTarget}
                  onChange={(event) =>
                    setCategoryForm((currentForm) => ({
                      ...currentForm,
                      responseTarget: event.target.value,
                    }))
                  }
                  placeholder="Example: 4 hours"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="category-location">
                Default location
              </label>
              <input
                id="category-location"
                type="text"
                required
                value={categoryForm.defaultLocation}
                onChange={(event) =>
                  setCategoryForm((currentForm) => ({
                    ...currentForm,
                    defaultLocation: event.target.value,
                  }))
                }
                placeholder="Example: Computer Lab 2"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              />
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Routing summary
              </p>
              <p className="mt-2 text-sm text-slate-600">
                The department name appears in ticket forms. Department, service label, location, and response target are used across the public landing page and operations views.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetCategoryForm}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSavingCategory}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingCategory
                  ? editingCategoryId
                    ? 'Saving...'
                    : 'Creating...'
                  : editingCategoryId
                    ? 'Save Changes'
                    : 'Create Department'}
              </button>
            </div>
          </form>
        </div>
      </section>
    )
  }

  function renderOperationsView() {
    if (effectiveRole === 'STAFF') {
      return renderStaffDashboard()
    }

    return (
      <>
        {renderOverviewCards()}

        <section className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Ticket management</h2>
          <p className="mt-1 text-sm text-slate-500">
            View all tickets, assign the correct owner, and manage operational ticket handling from
            one queue.
          </p>
        </section>
      </>
    )
  }

  function renderBasicAccessView() {
    return (
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Submission access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Temporary role preview is set to `{effectiveRole}`. This access level is limited to
            ticket submission flows.
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278]"
          >
            Submit Ticket
          </button>
        </article>

        <article className="rounded-3xl border border-slate-200/80 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Available departments</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categoryOptions.map((category) => (
              <div key={category} className="rounded-2xl bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{category}</p>
                <p className="mt-1 text-sm text-slate-500">{categoryMeta[category]?.department}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    )
  }

  function renderPublicLandingPage() {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.12),_transparent_24%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_50%,_#f7fafc_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-[36px] border border-white/70 bg-[#003366] px-8 py-10 text-white shadow-[0_32px_100px_rgba(15,23,42,0.14)] sm:px-10 lg:px-12">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#FFCC00]">
              Universiti Malaysia Terengganu
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight">
              Smart Campus Support System
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
              Submit campus support requests directly without signing in. Staff and admin users can
              still access the operations workspace from the login panel.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
              <div className="border-b border-slate-200/80 pb-6">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">
                  Public Ticket Submission
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Report an issue
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Share your contact details and issue summary so the support team can route the
                  request to the correct department.
                </p>
              </div>

              {submitNotice ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {submitNotice}
                </div>
              ) : null}

              {error ? (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="public-requester-name">
                      Your name
                    </label>
                    <input
                      id="public-requester-name"
                      type="text"
                      required
                      value={form.requesterName}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          requesterName: event.target.value,
                        }))
                      }
                      placeholder="Enter your full name"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="public-requester-email">
                      Email address
                    </label>
                    <input
                      id="public-requester-email"
                      type="email"
                      required
                      value={form.requesterEmail}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          requesterEmail: event.target.value,
                        }))
                      }
                      placeholder="name@umt.edu.my"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="public-title">
                    Title
                  </label>
                  <input
                    id="public-title"
                    type="text"
                    required
                    value={form.title}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Example: Lab 2 Wi-Fi disconnected during class"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="public-category">
                      Department
                    </label>
                    <select
                      id="public-category"
                      value={form.category}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          category: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Routed department
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {categoryMeta[form.category]?.department}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{categoryMeta[form.category]?.sla}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="public-description">
                    Description
                  </label>
                  <textarea
                    id="public-description"
                    required
                    rows="6"
                    value={form.description}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe the issue, exact location, impact on campus operations, and any urgent safety or teaching risks."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                  />
                </div>

                <div className="grid gap-4 rounded-3xl bg-slate-50 p-4 sm:grid-cols-3">
                  <MiniStat label="Department" value={categoryMeta[form.category]?.serviceLabel} />
                  <MiniStat label="Default location" value={categoryMeta[form.category]?.location} />
                  <MiniStat label="Response target" value={categoryMeta[form.category]?.sla} />
                </div>

                <div className="flex justify-end border-t border-slate-200 pt-5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </section>

            <section className="space-y-6">
              <article className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">
                  Staff & Admin Access
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Sign in to the console
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Use your username or email and password to access ticket operations, dispatching,
                  assigned work queues, and user management.
                </p>

                {authError ? (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                ) : null}

                <form className="mt-8 space-y-5" onSubmit={handleLoginSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="login">
                      Email or username
                    </label>
                    <input
                      id="login"
                      type="text"
                      required
                      value={loginForm.login}
                      onChange={(event) =>
                        setLoginForm((currentForm) => ({
                          ...currentForm,
                          login: event.target.value,
                        }))
                      }
                      placeholder="admin@umt.edu.my"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="password">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((currentForm) => ({
                          ...currentForm,
                          password: event.target.value,
                        }))
                      }
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoggingIn ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </article>

              <article className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
                <h2 className="text-lg font-semibold text-slate-950">Available departments</h2>
                <div className="mt-4 grid gap-3">
                  {categoryOptions.map((category) => (
                    <div key={category} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{category}</p>
                      <p className="mt-1 text-sm text-slate-500">{categoryMeta[category]?.department}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </div>
      </div>
    )
  }

  function renderActiveView() {
    if (activeNav === 'report-issue') return renderBasicAccessView()
    if (activeNav === 'assigned-tickets') return renderAssignedTicketsPage()
    if (activeNav === 'ticket-management') return renderManagementPage()
    if (activeNav === 'assignee-management' && isOperationsRole(effectiveRole)) {
      return renderAssigneeManagementPage()
    }
    if (activeNav === 'category-management' && isOperationsRole(effectiveRole)) {
      return renderCategoryManagementPage()
    }
    if (activeNav === 'user-management' && effectiveRole === 'ADMIN') {
      return renderUserManagementPage()
    }

    if (!isOperationsRole(effectiveRole) && !isAssigneeRole(effectiveRole)) {
      return renderBasicAccessView()
    }

    return renderOperationsView()
  }

  function renderSubmissionPortal() {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.12),_transparent_24%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_50%,_#f7fafc_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">
                  Smart Campus Support System
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Submit Ticket
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  This fallback screen is for signed-in requester access only.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#003366] text-sm font-semibold text-white">
                    {(currentUser.username || currentUser.role || 'US').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-slate-900">
                      {currentUser.username || 'System User'}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {currentUser.role}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-[#003366]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </header>

            {submitNotice ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {submitNotice}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Need campus support?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Report IT, maintenance, security, academic, or facilities issues to the support
                  team.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278]"
                >
                  Submit Ticket
                </button>
              </article>

              <article className="rounded-3xl border border-slate-200/80 bg-slate-50 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">Available departments</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {categoryOptions.map((category) => (
                    <div key={category} className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{category}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {categoryMeta[category]?.department}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </div>
        {renderTicketModal()}
      </div>
    )
  }

  function renderTicketModal() {
    if (!isModalOpen) {
      return null
    }

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center">
        <div className="w-full max-w-2xl rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">
                Report Issue
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Submit a support ticket
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Capture the issue, location, and operational impact so the correct department can
                triage it quickly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="requester-name">
                  Your name
                </label>
                <input
                  id="requester-name"
                  type="text"
                  required
                  value={form.requesterName}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      requesterName: event.target.value,
                    }))
                  }
                  placeholder="Enter your full name"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="requester-email">
                  Email address
                </label>
                <input
                  id="requester-email"
                  type="email"
                  required
                  value={form.requesterEmail}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      requesterEmail: event.target.value,
                    }))
                  }
                  placeholder="name@umt.edu.my"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value,
                  }))
                }
                placeholder="Example: Lab 2 Wi-Fi disconnected during class"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="category">
                  Department
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      category: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Routed department
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {categoryMeta[form.category]?.department}
                </p>
                <p className="mt-1 text-sm text-slate-500">{categoryMeta[form.category]?.sla}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                required
                rows="5"
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe the issue, exact location, impact on teaching or campus operations, and any urgent risks."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              />
            </div>

            <div className="grid gap-4 rounded-3xl bg-slate-50 p-4 sm:grid-cols-3">
              <MiniStat label="Department" value={categoryMeta[form.category]?.serviceLabel} />
              <MiniStat label="Default location" value={categoryMeta[form.category]?.location} />
              <MiniStat label="Response target" value={categoryMeta[form.category]?.sla} />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.12),_transparent_24%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_50%,_#f7fafc_100%)] px-4">
        <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#003366] text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
            Checking session
          </h1>
          <p className="mt-2 text-sm text-slate-500">Validating Smart Campus access.</p>
        </div>
      </div>
    )
  }

  if (!token || !currentUser) {
    return renderPublicLandingPage()
  }

  if (!isOperationsRole(effectiveRole) && !isAssigneeRole(effectiveRole) && !temporaryRole) {
    return renderSubmissionPortal()
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.12),_transparent_24%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_50%,_#f7fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] items-stretch">
        <Sidebar
          activeNav={activeNav}
          isOpen={isSidebarOpen}
          items={navItems}
          onClose={() => setIsSidebarOpen(false)}
          onSelect={handleSelectNav}
          summary={{
            total,
            inProgress,
            resolved,
          }}
        />

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur xl:p-6">
            <header className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">
                    Smart Campus Support System
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {panelTitle}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Primary admin workspace for triage, routing, assignment, and resolution
                    management.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <label className="relative block min-w-0 xl:min-w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                  />
                </label>

                <div className="flex items-center gap-3 self-start xl:self-auto">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#003366] text-sm font-semibold text-white">
                      {(currentUser.username || currentUser.role || 'OP').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-semibold text-slate-900">
                        {currentUser.username || 'Operations User'}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {effectiveRole}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-[#003366]"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </header>

            {isDemoMode ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Interface demo mode is active because the backend ticket service could not be reached.
                Showing fallback ticket data until the API becomes available again.
              </div>
            ) : null}

            {error ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {renderActiveView()}
          </div>
        </main>
      </div>

      {renderTicketModal()}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function TicketDetailsPanel({
  commentValue,
  mode = 'management',
  onAssigneeChange,
  onCommentChange,
  onCommentSubmit,
  onStatusChange,
  selectedAssigneeOptions,
  ticket,
}) {
  if (!ticket) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">No ticket selected</h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose a ticket from the queue to review details, comments, and operational actions.
        </p>
      </section>
    )
  }

  const statusBadge = statusConfig[ticket.status] || statusConfig.OPEN
  const showAssignment = mode === 'management' || mode === 'assignment'
  const showStatus = mode === 'management' || mode === 'status' || mode === 'status-comments'
  const showComments = mode === 'management' || mode === 'comments' || mode === 'status-comments'
  const showMetaGrid = mode !== 'comments'
  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              SCSS-{ticket.id ?? 'NEW'}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">{ticket.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{ticket.description}</p>
          </div>
        </div>

        {showMetaGrid ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailStat icon={MapPin} label="Location" value={ticket.location} />
            <DetailStat icon={Wrench} label="Department" value={ticket.department} />
            <DetailStat icon={UserRound} label="Assignee" value={ticket.assignee} />
            <DetailStat icon={Clock3} label="Created" value={formatDateTime(ticket.createdAt)} />
          </div>
        ) : null}

        {showAssignment || showStatus ? (
          <div className="mt-6 grid gap-4 rounded-3xl bg-slate-50 p-4">
            <div className={`grid gap-4 ${showAssignment && showStatus ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
              {showStatus ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Status</span>
                  <select
                    value={ticket.status}
                    onChange={(event) => onStatusChange(ticket.id, event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:ring-4 focus:ring-[#003366]/10"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showAssignment ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Assignee</span>
                  <select
                    value={ticket.assignee}
                    onChange={(event) => onAssigneeChange(ticket.id, event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:ring-4 focus:ring-[#003366]/10"
                  >
                    {selectedAssigneeOptions.map((assignee) => (
                      <option key={assignee} value={assignee}>
                        {assignee}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>
        ) : null}
      </article>

      {showComments ? (
      <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Comments & history</h2>
            <p className="mt-1 text-sm text-slate-500">
              Lifecycle notes, staff updates, and requestor follow-up.
            </p>
          </div>
          <MessageSquare className="h-5 w-5 text-[#003366]" />
        </div>

        <form className="mt-5" onSubmit={onCommentSubmit}>
          <label className="sr-only" htmlFor="new-comment">
            New comment
          </label>
          <textarea
            id="new-comment"
            rows="3"
            value={commentValue}
            onChange={(event) => onCommentChange(event.target.value)}
            placeholder={
              'Add an internal update or a reply for the requestor.'
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white transition hover:bg-[#0a4278]"
            >
              Post update
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-4">
          {ticket.comments.map((comment) => (
            <article key={comment.id} className="rounded-3xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {comment.role}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{comment.message}</p>
            </article>
          ))}
        </div>
      </article>
      ) : null}
    </section>
  )
}

function DetailStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#003366] shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default App
