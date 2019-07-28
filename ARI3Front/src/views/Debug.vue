<template>
	<el-container>
		<MainMenu />
		<el-container>
			<el-aside width="100px">Aside</el-aside>
			<el-container>
				<el-main style="padding: 0"> 
					<log-box /> 
				</el-main>
			</el-container>
		</el-container>
		<el-footer height="">Footer</el-footer>
	</el-container>
</template>

<script>
import MainMenu from "../components/MainMenu"
import LogBox from "../components/LogBox"
export default {
	name: "DebugView",
	components: {
		MainMenu,
		LogBox
	},
	data() {
		return {
		}
	},
	methods: {},
	created() {
		this.$notify({
			title: "EY!",
			message: "Debug view started!"
		})
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.el-container {
	height: 100%;
}
.el-header,
.el-footer {
	background-color: #202020;
	color: rgb(255, 255, 255);
}

.el-aside { 
	background-color: #202020;
	color: white;
}

.el-main {
	background-color: #101010;
	color: white;
}
</style>
