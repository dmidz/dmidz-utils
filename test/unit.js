
const Lab = require('lab')
	, lab = exports.lab = Lab.script()
	, dutils = require('../lib')
	;

lab.experiment('dmidz-utils', function(){

	lab.before(function( done ){
		done();
	});

	lab.test('check( v, wishtype, flag ).', function( done ){
		Lab.expect( check( undefined ) ).to.be.false();
		Lab.expect( check( null ) ).to.be.false();
		Lab.expect( check( '' ) ).to.be.true();
		Lab.expect( check( 0 ) ).to.be.true();
		Lab.expect( check( 1 ) ).to.be.true();
		Lab.expect( check( [] ) ).to.be.true();
		Lab.expect( check( '', 's' ) ).to.be.true();
		Lab.expect( check( '', 'a' ) ).to.be.false();
		Lab.expect( check( 0, 'n' ) ).to.be.true();
		Lab.expect( check( '0', 'n' ) ).to.be.false();
		Lab.expect( check( true, 'b' ) ).to.be.true();
		Lab.expect( check( 1, 'b' ) ).to.be.false();
		Lab.expect( check( [], 'a' ) ).to.be.true();
		Lab.expect( check( [], 'o' ) ).to.be.false();
		Lab.expect( check( {}, 'o' ) ).to.be.true();
		Lab.expect( check( {}, 'a' ) ).to.be.false();
		Lab.expect( check( function(){}, 'f' ) ).to.be.true();
		Lab.expect( check( 0, 'n', 1 ) ).to.be.false();
		Lab.expect( check( 2, 'n', 1 ) ).to.be.true();
		Lab.expect( check( '', 's', 1 ) ).to.be.false();
		Lab.expect( check( 'h', 's', 1 ) ).to.be.true();
		Lab.expect( check( 'hh', 'a', 3 ) ).to.be.false();
		Lab.expect( check( [], 'a', 1 ) ).to.be.false();
		Lab.expect( check( ['one','two'], 'a', 1 ) ).to.be.true();
		Lab.expect( check( ['one','two'], 'a', 3 ) ).to.be.false();
		done();
	});

	//__ TODO : finish unit test & descriptions
	lab.test('dutils.mixin( dest, src, deep )', function( done ){
		Lab.expect( dutils.mixin(null) ).to.be.an.object();
		let obj_to = {a:15, b:'astring', c:['a','b','c']
			, d:{alpha:1, beta:'gamma', subarray:[12,23,34], subobj:{ ohm:59, zeta:'Hello!'}}};
		Lab.expect( dutils.mixin( obj_to, null) ).to.equal( obj_to );
		let subarr = ['x','y','z']
			, subobj = {mona:'lisa'}
			;
		let obj_from = {b:'anotherstring', c:['d','e','f'], e:'hey!', f:subarr, g:subobj};
		let obj_mix = dutils.mixin( obj_to, obj_from );
		Lab.expect( obj_mix ).to.equal( obj_to );
		let res = true;
		for(let st in obj_from ){
			if( !(st in obj_to) ){     res = false; break;}
		}
		Lab.expect( res ).to.equal( true );
		Lab.expect( obj_to.a ).to.equal( 15 );
		Lab.expect( obj_to.b ).to.equal( 'anotherstring' );
		Lab.expect( obj_to.c ).to.equal( ['d','e','f'] );


		obj_to = { a:{ aa:{ aaa:'aaa', bbb:'bbb'}} };
		obj_from = { a:{ aa:{ bbb:'ccc'}} };
		dutils.mixin( obj_to, obj_from, true );
		Lab.expect( obj_to.a.aa.aaa ).to.equal( 'aaa' );
		Lab.expect( obj_to.a.aa.bbb ).to.equal( 'ccc' );

		done();
	});


});

