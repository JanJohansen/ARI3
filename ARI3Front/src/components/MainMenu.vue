<template>
  <el-menu
    class="el-menu-demo"
    mode="horizontal"
    @select="0"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
  >
    <el-submenu index="1" :showTimeout="0">
      <template slot="title">Pages</template>
      <router-link to="/">
        <el-menu-item index="0">Home</el-menu-item>
      </router-link>
      <router-link to="/about">
        <el-menu-item index="1">About</el-menu-item>
      </router-link>
      <router-link to="/develop">
        <el-menu-item index="2">Develop</el-menu-item>
      </router-link>
      <router-link to="/flow">
        <el-menu-item index="3">Flow</el-menu-item>
      </router-link>
    </el-submenu>
    <el-submenu index="0" :showTimeout="0">
      <template slot="title">File</template>
      <el-menu-item index="2-1">Open</el-menu-item>
      <el-menu-item index="2-2">Save</el-menu-item>
      <el-menu-item index="2-3">Save as...</el-menu-item>
      <el-submenu index="2-4" :showTimeout="0">
        <template slot="title">Open recent...</template>
        <el-menu-item index="2-4-1">TestProject1</el-menu-item>
        <el-menu-item index="2-4-2">TestProject2</el-menu-item>
      </el-submenu>
    </el-submenu>
    <div class="onlineClass" @click="handleClick">
      <el-badge
        :value="online ? 'Connected (' + ping + 'ms)' : 'Disconnected!'"
        :type="online ? 'success' : 'danger'"
      ></el-badge>
    </div>
  </el-menu>
</template>

<script>
export default {
  name: "MainMenu",
  methods: {
    handleClick: function() {
      console.log("bum bum");
      this.online.v ^= true;
    }
  },
  data: function() {
    return {
      online: false,
      ping: -1
    };
  },
  mounted: async function() {
    this.$ari.on(".connection.connected", v => {
      this.online = v;
    });
    this.$ari.on(".connection.ping", v => {
      this.ping = v;
    });
    this.$ari.on(".connection.ready", async () => {
      let result = await this.$ari.call("testCall", 42);
      console.log("Result:", result);
    });
  }
};
</script>

<style lang="less">
.onlineClass {
  text-align: right;
}
</style>
