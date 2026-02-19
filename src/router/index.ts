import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Landing', component: () => import('../views/LandingView.vue'), meta: { guest: true, title: 'Phasepoint' } },
  { path: '/about', name: 'About', component: () => import('../views/AboutView.vue'), meta: { guest: true, title: 'About Us' } },
  { path: '/services', name: 'Services', component: () => import('../views/ServicesView.vue'), meta: { guest: true, title: 'Services' } },
  { path: '/compliance', name: 'Compliance', component: () => import('../views/ComplianceView.vue'), meta: { guest: true, title: 'Compliance & Certifications' } },
  { path: '/contact', name: 'Contact', component: () => import('../views/ContactView.vue'), meta: { guest: true, title: 'Contact Us' } },
  { path: '/resources', name: 'Resources', component: () => import('../views/ResourcesView.vue'), meta: { guest: true, title: 'Resources' } },
  { path: '/login', name: 'Login', component: () => import('../views/CustomerLoginView.vue'), meta: { guest: true, title: 'Sign in' } },
  { path: '/customer/login', redirect: (to: any) => ({ path: '/login', query: to.query }) },
  { path: '/customer/register', name: 'CustomerRegister', component: () => import('../views/CustomerRegisterView.vue'), meta: { guest: true, title: 'Customer register' } },
  {
    path: '/kiosk',
    name: 'Kiosk',
    component: () => import('../views/KioskView.vue'),
    meta: { kiosk: true, title: 'Kiosk' },
  },
  { path: '/employee-portal/login', redirect: (to: any) => ({ path: '/login', query: to.query }) },
  {
    path: '/employee-portal',
    component: () => import('../views/AppLayout.vue'),
    meta: { requiresAuth: true, employeeOnly: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'profile', name: 'EmployeeProfile', component: () => import('../views/EmployeeProfileView.vue'), meta: { title: 'My profile' } },
      { path: 'intake', name: 'Intake', component: () => import('../views/IntakeView.vue'), meta: { title: 'Intake' } },
      { path: 'intake-requests/:id', name: 'IntakeRequestDetail', component: () => import('../views/IntakeRequestDetailView.vue'), meta: { title: 'Intake request' } },
      { path: 'status-requests', name: 'StatusRequestsInbox', component: () => import('../views/StatusRequestsInboxView.vue'), meta: { title: 'Status Requests' } },
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
          {
            path: 'tracking',
            component: () => import('../views/CustomerTrackingLayout.vue'),
            meta: { title: 'Tracking', customerPortalReadonly: true },
            children: [
              { path: '', redirect: { name: 'CustomerPortalPreviewTrackingRequests' } },
              { path: 'requests', name: 'CustomerPortalPreviewTrackingRequests', component: () => import('../views/CustomerRequestsListView.vue'), meta: { title: 'Requests', customerPortalReadonly: true } },
              { path: 'assets', name: 'CustomerPortalPreviewTrackingAssets', component: () => import('../views/CustomerAssetListView.vue'), meta: { title: 'My Assets', customerPortalReadonly: true } },
              { path: 'assets/:id', name: 'CustomerPortalPreviewTrackingAssetDetail', component: () => import('../views/CustomerAssetDetailView.vue'), meta: { title: 'Asset Detail', customerPortalReadonly: true } },
              { path: 'shipments', name: 'CustomerPortalPreviewTrackingShipments', component: () => import('../views/CustomerShipmentsListView.vue'), meta: { title: 'My Shipments', customerPortalReadonly: true } },
              { path: 'shipments/:id', name: 'CustomerPortalPreviewTrackingShipmentDetail', component: () => import('../views/CustomerShipmentDetailView.vue'), meta: { title: 'Shipment Detail', customerPortalReadonly: true } },
              { path: 'audit', name: 'CustomerPortalPreviewTrackingAudit', component: () => import('../views/CustomerAuditTrailView.vue'), meta: { title: 'Audit Trail', customerPortalReadonly: true } },
            ],
          },
          { path: 'assets', name: 'CustomerPortalPreviewAssets', component: () => import('../views/CustomerAssetListView.vue'), meta: { title: 'My Assets', customerPortalReadonly: true } },
          { path: 'assets/:id', name: 'CustomerPortalPreviewAssetDetail', component: () => import('../views/CustomerAssetDetailView.vue'), meta: { title: 'Asset Detail', customerPortalReadonly: true } },
          { path: 'shipments', name: 'CustomerPortalPreviewShipments', component: () => import('../views/CustomerShipmentsListView.vue'), meta: { title: 'My Shipments', customerPortalReadonly: true } },
          { path: 'shipments/:id', name: 'CustomerPortalPreviewShipmentDetail', component: () => import('../views/CustomerShipmentDetailView.vue'), meta: { title: 'Shipment Detail', customerPortalReadonly: true } },
          { path: 'audit', name: 'CustomerPortalPreviewAuditTrail', component: () => import('../views/CustomerAuditTrailView.vue'), meta: { title: 'Audit Trail', customerPortalReadonly: true } },
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
      {
        path: 'tracking',
        component: () => import('../views/CustomerTrackingLayout.vue'),
        meta: { title: 'Tracking', customerOnly: true },
        children: [
          { path: '', redirect: { name: 'CustomerTrackingRequests' } },
          { path: 'requests', name: 'CustomerTrackingRequests', component: () => import('../views/CustomerRequestsListView.vue'), meta: { title: 'Requests', customerOnly: true } },
          { path: 'assets', name: 'CustomerTrackingAssets', component: () => import('../views/CustomerAssetListView.vue'), meta: { title: 'My Assets', customerOnly: true } },
          { path: 'assets/:id', name: 'CustomerTrackingAssetDetail', component: () => import('../views/CustomerAssetDetailView.vue'), meta: { title: 'Asset Detail', customerOnly: true } },
          { path: 'shipments', name: 'CustomerTrackingShipments', component: () => import('../views/CustomerShipmentsListView.vue'), meta: { title: 'My Shipments', customerOnly: true } },
          { path: 'shipments/:id', name: 'CustomerTrackingShipmentDetail', component: () => import('../views/CustomerShipmentDetailView.vue'), meta: { title: 'Shipment Detail', customerOnly: true } },
          { path: 'audit', name: 'CustomerTrackingAudit', component: () => import('../views/CustomerAuditTrailView.vue'), meta: { title: 'Audit Trail', customerOnly: true } },
        ],
      },
      { path: 'assets', name: 'CustomerAssets', component: () => import('../views/CustomerAssetListView.vue'), meta: { title: 'My Assets', customerOnly: true } },
      { path: 'assets/:id', name: 'CustomerAssetDetail', component: () => import('../views/CustomerAssetDetailView.vue'), meta: { title: 'Asset Detail', customerOnly: true } },
      { path: 'shipments', name: 'CustomerShipments', component: () => import('../views/CustomerShipmentsListView.vue'), meta: { title: 'My Shipments', customerOnly: true } },
      { path: 'shipments/:id', name: 'CustomerShipmentDetail', component: () => import('../views/CustomerShipmentDetailView.vue'), meta: { title: 'Shipment Detail', customerOnly: true } },
      { path: 'audit', name: 'CustomerAuditTrail', component: () => import('../views/CustomerAuditTrailView.vue'), meta: { title: 'Audit Trail', customerOnly: true } },
      { path: 'users', name: 'CustomerPortalUsers', component: () => import('../views/CustomerPortalUsersView.vue'), meta: { title: 'Team Users', customerOnly: true } },
      { path: 'profile', name: 'CustomerProfile', component: () => import('../views/CustomerProfileView.vue'), meta: { title: 'Profile', customerOnly: true } },
      { path: 'terms', name: 'CustomerTerms', component: () => import('../views/CustomerTermsView.vue'), meta: { title: 'Terms & Conditions', customerOnly: true } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // If there's a saved position (e.g., browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }
    // Otherwise scroll to top
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach(async (to) => {
  const kioskId = import.meta.env.VITE_KIOSK_ID
  if (kioskId && to.path === '/') return { path: '/kiosk' }
  if (to.meta.kiosk) return true
  
  // Use Pinia auth store instead of direct API call
  const { useAuthStore } = await import('../stores/auth')
  const authStore = useAuthStore()
  
  // Fetch user if not cached or cache expired (store handles caching internally)
  const me = await authStore.fetchUser()
  
  if (!me) {
    // Not authenticated
    if (to.meta.requiresAuth || to.meta.requiresPolicyAccept) {
      return { name: 'Login', query: { redirect: to.path } }
    }
    // Allow guest routes
    if (to.meta.guest) return true
    return true
  }
  
  // User is authenticated - redirect away from login/registration pages to their dashboard
  if (to.name === 'Login' || to.name === 'CustomerRegister' || to.path === '/login' || to.path === '/customer/register' || to.path === '/customer/login' || to.path === '/employee-portal/login') {
    if (me.user_type === 'CUSTOMER') return '/customer-portal'
    if (me.user_type === 'EMPLOYEE') return '/employee-portal'
  }
  if (to.meta.employeeOnly && me.user_type !== 'EMPLOYEE') return '/customer-portal'
  if (to.path.startsWith('/employee-portal') && me.user_type !== 'EMPLOYEE') return '/customer-portal'
  if (to.meta.customerOnly && me.user_type !== 'CUSTOMER') return '/employee-portal'
  const isEmployeeRoute = to.path.startsWith('/employee-portal')
  const isEmployeeUser = me.user_type === 'EMPLOYEE'
  const currentHash = me.current_bundle_hash
  const acknowledgedHash = me.acknowledged_bundle_hash
  const needsPolicyAccept = !acknowledgedHash || currentHash !== acknowledgedHash
  // When user must accept policies, allow only the policy list and policy detail (so they can read before accepting)
  if (isEmployeeRoute && isEmployeeUser && to.meta.requiresAuth && needsPolicyAccept) {
    const policyReadRouteNames = ['Policies', 'PolicyDetail', 'AllPolicies']
    if (to.name && policyReadRouteNames.includes(to.name as string)) return true
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
