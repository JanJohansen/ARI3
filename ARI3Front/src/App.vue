<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: "App",
  components: {},
  data() {
    return {
      connected: false
    };
  },
  methods: {},
  created: function() {
  },
  mounted: function() {
    let self = this;
    // Set up notification for connection
    self.$ari.on(".connection.connected", v => {
      if (v) {
        self.$notify({
          title: "Connected!"
        });
      } else {
        self.$notify({
          title: "Disconnected!",
          message: "Retrying..."
        });
      }
    });
  }
};
</script>

<style lang="less">
html {
  height: 100%;
}
body {
  background-color: black;
  color: white;
  font-family: Arial, sans-serif;
  margin: 0;
  height: 100%;
}
#app {
  height: 100%;
}
</style>
