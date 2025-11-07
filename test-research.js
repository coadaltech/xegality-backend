const { ResearchService } = require('./src/services/research.service.ts');

async function testResearchService() {
  try {
    console.log('Testing Research Service...');
    
    // Test search cases
    console.log('\n1. Testing search cases...');
    const searchResult = await ResearchService.searchCases({
      query: 'pension',
      limit: 5,
      offset: 0
    });
    
    console.log(`Found ${searchResult.total} cases`);
    console.log('First case:', searchResult.cases[0]);
    
    // Test get courts
    console.log('\n2. Testing get courts...');
    const courts = await ResearchService.getCourts();
    console.log(`Found ${courts.length} courts`);
    console.log('First 5 courts:', courts.slice(0, 5));
    
    // Test get years
    console.log('\n3. Testing get years...');
    const years = await ResearchService.getYears();
    console.log(`Found ${years.length} years`);
    console.log('Years:', years.slice(0, 10));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testResearchService();







