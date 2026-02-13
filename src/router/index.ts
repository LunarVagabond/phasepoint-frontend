import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Landing', component: () => import('../views/LandingView.vue'), meta: { guest: true, title: 'Phasepoint' } },
  { path: '/customer/login', name: 'CustomerLogin', component: () => import('../views/CustomerLoginView.vue'), meta: { guest: true, title: 'Customer portal' } },
  { path: '/customer/register', name: 'CustomerRegister', component: () => import('../views/CustomerRegisterView.vue'), meta: { guest: true, title: 'Customer register' } },
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
    meta: { requiresAuth: true, employeeOnly: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'profile', name: 'EmployeeProfile', component: () => import('../views/EmployeeProfileView.vue'), meta: { title: 'My profile' } },
      { path: 'intake', name: 'Intake', component: () => import('../views/IntakeView.vue'), meta: { title: 'Intake' } },
      { path: 'assets', name: 'Assets', component: () => import('../views/AssetListView.vue'), meta: { title: 'Assets' } },
      { path: 'work-orders', name: 'OperationsWorkOrders', component: () => import('../views/OperationsWorkOrdersView.vue'), meta: { title: 'Work Orders' } },
      { path: 'work-orders/:id', name: 'WorkOrderDetail', component: () => import('../views/WorkOrderDetailView.vue'), meta: { title: 'Work Order' } },
      { path: 'shipments', name: 'ShipmentsList', component: () => import('../views/ShipmentsListView.vue'), meta: { title: 'Shipments' } },
      { path: 'shipments/:id', name: 'ShipmentDetail', component: () => import('../views/ShipmentDetailView.vue'), meta: { title: 'Shipment' } },
      { path: 'batches', name: 'Batches', component: () => import('../views/BatchesListView.vue'), meta: { title: 'Batches' } },
      { path: 'audit', name: 'Audit', component: () => import('../views/AuditTrailView.vue'), meta: { title: 'Audit trail' } },
      { path: 'reports', name: 'Reports', component: () => import('../views/ReportsView.vue'), meta: { title: 'Reports' } },
      { path: 'customers/:customerId/context', name: 'CustomerContextInternal', component: () => import('../views/CustomerContextInternalView.vue'), meta: { title: 'Customer Context' } },
      { path: 'customers/:customerId', name: 'CustomerDetail', component: () => import('../views/CustomerDetailView.vue'), meta: { title: 'Customer Detail' } },
      {
        path: 'customers/:customerId/portal',
        component: () => import('../views/CustomerPortalLayout.vue'),
        meta: { employeeOnly: true, customerPortalReadonly: true, title: 'Customer Portal Preview' },
        children: [
          { path: '', name: 'CustomerPortalPreviewDashboard', component: () => import('../views/CustomerDashboardView.vue'), meta: { title: 'Customer Dashboard', customerPortalReadonly: true } },
          { path: 'terms', name: 'CustomerPortalPreviewTerms', component: () => import('../views/CustomerTermsView.vue'), meta: { title: 'Terms & Conditions', customerPortalReadonly: true } },
          { path: 'requests/new', name: 'CustomerPortalPreviewRequest', component: () => import('../views/RequestQuoteView.vue'), meta: { title: 'Create Request', customerPortalReadonly: true } },
          { path: 'requests/:id', name: 'CustomerPortalPreviewRequestDetail', component: () => import('../views/CustomerRequestDetailView.vue'), meta: { title: 'Request detail', customerPortalReadonly: true } },
          { path: 'users', name: 'CustomerPortalPreviewUsers', component: () => import('../views/CustomerPortalUsersView.vue'), meta: { title: 'Team Users', customerPortalReadonly: true } },
          { path: 'profile', name: 'CustomerPortalPreviewProfile', component: () => import('../views/CustomerProfileView.vue'), meta: { title: 'Profile', customerPortalReadonly: true } },
        ],
      },
      {
        path: 'policies',
        component: () => import('../views/DocWikiLayout.vue'),
        meta: { requiresPolicyAccept: true, docType: 'policy' },
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
      {
        path: 'procedures',
        component: () => import('../views/DocWikiLayout.vue'),
        meta: { docType: 'procedure' },
        children: [
          { path: '', name: 'Procedures', component: () => import('../views/ProceduresWikiList.vue'), meta: { title: 'Processes and Procedures' } },
          { path: 'all', name: 'AllProcedures', component: () => import('../views/ProceduresWikiAllView.vue'), meta: { title: 'All Procedures' } },
          { path: 'drafts', name: 'ProcedureDrafts', component: () => import('../views/ProcedureDraftsView.vue'), meta: { title: 'Drafts', requiresPolicyEditor: true } },
          { path: ':slug', name: 'ProcedureDetail', component: () => import('../views/ProceduresWikiDetail.vue'), meta: { title: 'Procedure' } },
        ],
      },
      {
        path: 'procedures/edit/:slug?',
        name: 'ProcedureEditor',
        component: () => import('../views/ProcedureEditorView.vue'),
        meta: { requiresPolicyEditor: true, title: 'Edit Procedure' },
      },
    ],
  },
  {
    path: '/customer-portal',
    component: () => import('../views/CustomerPortalLayout.vue'),
    meta: { requiresAuth: true, customerOnly: true },
    children: [
      { path: '', name: 'CustomerDashboard', component: () => import('../views/CustomerDashboardView.vue'), meta: { title: 'Customer Dashboard' } },
      { path: 'requests/new', name: 'CustomerRequest', component: () => import('../views/RequestQuoteView.vue'), meta: { title: 'Create Request', customerOnly: true } },
      { path: 'requests/:id', name: 'CustomerRequestDetail', component: () => import('../views/CustomerRequestDetailView.vue'), meta: { title: 'Request detail', customerOnly: true } },
      { path: 'users', name: 'CustomerPortalUsers', component: () => import('../views/CustomerPortalUsersView.vue'), meta: { title: 'Team Users', customerOnly: true } },
      { path: 'profile', name: 'CustomerProfile', component: () => import('../views/CustomerProfileView.vue'), meta: { title: 'Profile', customerOnly: true } },
      { path: 'terms', name: 'CustomerTerms', component: () => import('../views/CustomerTermsView.vue'), meta: { title: 'Terms & Conditions', customerOnly: true } },
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
      return { name: 'Login', query: { redirect: to.path } }
    }
    return true
  }
  if (to.name === 'Login') {
    if (me.user_type === 'CUSTOMER') return '/customer-portal'
    const raw = (to.query.redirect as string) || '/employee-portal'
    const redirect = typeof raw === 'string' ? raw.split('?')[0].trim() || '/employee-portal' : '/employee-portal'
    return redirect.startsWith('/') ? redirect : '/employee-portal'
  }
  if (to.meta.employeeOnly && me.user_type !== 'EMPLOYEE') return '/customer-portal'
  if (to.path.startsWith('/employee-portal') && me.user_type !== 'EMPLOYEE') return '/customer-portal'
  if (to.meta.customerOnly && me.user_type !== 'CUSTOMER') return '/employee-portal'
  const isEmployeeRoute = to.path.startsWith('/employee-portal')
  const isEmployeeUser = me.user_type === 'EMPLOYEE'
  const currentHash = me.current_bundle_hash
  const acknowledgedHash = me.acknowledged_bundle_hash
  const needsPolicyAccept = !acknowledgedHash || currentHash !== acknowledgedHash
  if (isEmployeeRoute && isEmployeeUser && to.meta.requiresAuth && needsPolicyAccept) {
    if (to.name === 'Policies') return true
    return { name: 'Policies', query: { redirect: to.path } }
  }
  if (to.meta.requiresPolicyEditor) {
    const { canEditPolicies } = await import('../api')
    if (!canEditPolicies(me)) {
      const isProcedureRoute = to.path.startsWith('/employee-portal/procedures')
      return { name: isProcedureRoute ? 'Procedures' : 'Policies', query: { error: 'permission_denied' } }
    }
  }
  return true
})

export default router
