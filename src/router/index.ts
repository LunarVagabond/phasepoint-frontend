import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Landing', component: () => import('../views/LandingView.vue'), meta: { guest: true, title: 'Phasepoint' } },
  { path: '/request', name: 'RequestQuote', component: () => import('../views/RequestQuoteView.vue'), meta: { guest: true, title: 'Request a quote' } },
  {
    path: '/kiosk',
    name: 'Kiosk',
    component: () => import('../views/KioskView.vue'),
    meta: { kiosk: true, title: 'Kiosk' },
  },
  { path: '/employee-portal/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { guest: true, title: 'Employee portal' } },
  {
    path: '/employee-portal',
    component: () => import('../views/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'intake', name: 'Intake', component: () => import('../views/IntakeView.vue'), meta: { title: 'Intake' } },
      { path: 'assets', name: 'Assets', component: () => import('../views/AssetListView.vue'), meta: { title: 'Assets' } },
      { path: 'batches', name: 'Batches', component: () => import('../views/BatchesListView.vue'), meta: { title: 'Batches' } },
      { path: 'audit', name: 'Audit', component: () => import('../views/AuditTrailView.vue'), meta: { title: 'Audit trail' } },
      { path: 'reports', name: 'Reports', component: () => import('../views/ReportsView.vue'), meta: { title: 'Reports' } },
      {
        path: 'policies',
        component: () => import('../views/PolicyWikiLayout.vue'),
        meta: { requiresPolicyAccept: true },
        children: [
          { path: '', name: 'Policies', component: () => import('../views/PolicyWikiList.vue'), meta: { title: 'Policies' } },
          { path: 'all', name: 'AllPolicies', component: () => import('../views/PolicyWikiAllView.vue'), meta: { title: 'All Policies' } },
          { path: 'drafts', name: 'PolicyDrafts', component: () => import('../views/PolicyDraftsView.vue'), meta: { title: 'Drafts', requiresPolicyEditor: true } },
          { path: ':slug', name: 'PolicyDetail', component: () => import('../views/PolicyWikiDetail.vue'), meta: { title: 'Policy' } },
        ],
      },
      {
        path: 'policies/edit/:slug?',
        name: 'PolicyEditor',
        component: () => import('../views/PolicyEditorView.vue'),
        meta: { requiresPolicyEditor: true, title: 'Edit Policy' },
      },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const kioskId = import.meta.env.VITE_KIOSK_ID
  if (kioskId && to.path === '/') return { path: '/kiosk' }
  if (to.meta.guest) return true
  if (to.meta.kiosk) return true
  let me: Awaited<ReturnType<typeof import('../api').getMe>> | null = null
  try {
    const { getMe } = await import('../api')
    me = await getMe()
  } catch {
    if (to.meta.requiresAuth || to.meta.requiresPolicyAccept) {
      return { name: 'Login', query: { redirect: to.fullPath } }
    }
    return true
  }
  if (to.name === 'Login') {
    const redirect = (to.query.redirect as string) || '/employee-portal'
    return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/employee-portal'
  }
  const currentHash = me.current_bundle_hash
  const acknowledgedHash = me.acknowledged_bundle_hash
  const needsPolicyAccept = !acknowledgedHash || currentHash !== acknowledgedHash
  if (to.meta.requiresAuth && needsPolicyAccept) return { name: 'Policies', query: { redirect: to.fullPath } }
  if (to.meta.requiresPolicyEditor) {
    const { canEditPolicies } = await import('../api')
    if (!canEditPolicies(me)) {
      return { name: 'Policies', query: { error: 'permission_denied' } }
    }
  }
  return true
})

export default router
