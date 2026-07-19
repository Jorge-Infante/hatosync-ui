const tagsRouter = {
  component: () =>
    import(/* webpackChunkName: "tags-layout" */ '@/modules/tags/layouts/TagsLayout.vue'),
  redirect: { name: 'tags-batches' },
  // Generar/descargar/anular lotes es administración de la finca.
  meta: { roles: ['OWNER', 'ADMIN'] },
  children: [
    {
      path: 'batches',
      name: 'tags-batches',
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(/* webpackChunkName: "tags-batches" */ '@/modules/tags/pages/TagBatchListPage.vue'),
    },
  ],
}

export default tagsRouter
