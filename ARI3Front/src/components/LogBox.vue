<template>
  <div class="component">
    <div class="heading">
      <el-button size="mini" round @click="clearLog">Clear</el-button>
      <el-button size="mini" round>Pause</el-button>
    </div>
    <div class="logSection">
      <div v-for="(entry, index) of entries" v-bind:key="index">
        <div class="metaSection">
          <span class="instance">{{entry.instance}} </span>
          <span class="level">({{entry.level}}) @ </span>
          <span class="ts">{{entry.ts}}</span>
        </div>
        <div>
          <span class="messageSection">{{entry.text}}</span>
        </div>
      </div>
    </div>
  </div>  
</template>

<script>
export default {
  name: "LogBox",
  data() {
    return {
      entries: [
        {ts:"2019-01-08T01:10:22.548Z", level:"dev", instance:"WsServer", text:"Something happened!"},
        {ts:"2019-01-08T01:10:22.548Z", level:"dev", instance:"WsServer", text:"More is happaning!"},
      ],
    };
  },
  methods: {
    clearLog(){
      this.entries = []
    }
  },
  created() {
    var self = this
    setInterval(() => {
      self.entries.unshift({ts:new Date().toISOString(), level:"dev", instance:"WsServer", text:"Something happened!"})
      if(self.entries.length > 10) self.entries.pop()
    }, 1000);
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.component{
  display: flex;
  flex-direction: column;
  height: 100%;
  
}
.logSection{
  height: 100%;
  overflow-y: scroll
}
.metaSection {
  color: gray;
}
.level {
  font-size: 50%
}
.ts {
  font-size: 50%
}
</style>
