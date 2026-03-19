/**
 * Test Calendar Integration
 */

async function testCalendarAPI() {
  console.log('📅 Testing Calendar API...')
  console.log('')
  
  // Test iCal parsing with sample URL
  const sampleIcalUrl = 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics'
  
  try {
    console.log('Fetching sample calendar...')
    const response = await fetch(sampleIcalUrl)
    
    if (response.ok) {
      const icalData = await response.text()
      
      // Check if it's valid iCal format
      if (icalData.includes('BEGIN:VCALENDAR') && icalData.includes('BEGIN:VEVENT')) {
        console.log('✅ iCal format is valid')
        console.log('   Contains VCALENDAR:', icalData.includes('BEGIN:VCALENDAR'))
        console.log('   Contains VEVENT:', icalData.includes('BEGIN:VEVENT'))
        
        // Count events
        const eventCount = (icalData.match(/BEGIN:VEVENT/g) || []).length
        console.log('   Events found:', eventCount)
        console.log('')
        console.log('✅ Calendar parsing library should work')
        return true
      } else {
        console.log('❌ Invalid iCal format')
        return false
      }
    } else {
      console.log('⚠️  Could not fetch sample calendar')
      return false
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
    return false
  }
}

testCalendarAPI()
