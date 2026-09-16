const path = require('path');
const { store } = require('../src/store.js');
const { normalizedAbsolutePathForFS } = require('../src/utils.js');

store.configs = {
	alias: { '^/common/': '/statics/common/' },
	mapping_statics: [
		{ prefix: '/business_cib', dir: 'E:/ghca_code/xspace.business_statics/business_cib' }
	],
	globalLodash: {},
	globalVaribles: {}
};

const tests = [
	{
		name: 'S1 @/ in external mapped dir',
		doc: 'E:/ghca_code/xspace.business_statics/business_cib/src_distribution/views/A.vue',
		url: '@/src_request_resources/utils/reuseFormItem.vue',
		expect: 'business_statics'
	},
	{
		name: 'S2 /business_cib/ prefix path',
		doc: 'E:/ghca_code/xspace.business_statics/business_cib/src_distribution/views/A.vue',
		url: '/business_cib/src_distribution/components/ApplyRegion/ApplyRegion.vue',
		expect: 'business_statics'
	},
	{
		name: 'S3 /common/ alias',
		doc: 'E:/ghca_code/xspace/statics/business_xspace/views/x.vue',
		url: '/common/ui-x/xBtn.vue',
		expect: 'statics/common'
	},
	{
		name: 'S4 @/ in main project',
		doc: 'E:/ghca_code/xspace/statics/business_xspace/views/x.vue',
		url: '@/layout/AppLayout.vue',
		expect: 'business_xspace'
	}
];

let passCount = 0;
for (const t of tests) {
	const r = normalizedAbsolutePathForFS({
		documentUriPath: t.doc,
		urlInSourceCode: t.url
	});
	const ok = r && r.indexOf(t.expect.replace(/\//g, path.sep)) !== -1;
	if (ok) passCount++;
	console.log(`${ok ? 'OK' : 'FAIL'} ${t.name}`);
	console.log(`   => ${r}`);
}
console.log(`\n${passCount}/${tests.length} passed`);
process.exit(passCount === tests.length ? 0 : 1);