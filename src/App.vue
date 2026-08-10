<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default  {
  name: 'App',
  metaInfo() {
    const route = this.$route
    const menuTitle = route.meta && route.meta.title ? this.$t(route.meta.title) : ''
    return {
      title: this.$store.state.settings.dynamicTitle && menuTitle
          ? this.$t(this.$store.state.settings.title) + '｜' + menuTitle
          : this.$t(this.$store.state.settings.title),
      link: [
        {
          rel: 'icon',
          href: this.$store.state.settings.logo,
          type: 'image/png',
          vmid: 'favicon'
        }
      ]
    }
  },
  created() {
    this.$store.dispatch('OpenNoticeSocket');
  },
  beforeDestroy() {
    this.$store.dispatch('CloseNoticeSocket');
  },
}
</script>
