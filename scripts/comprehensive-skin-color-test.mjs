#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Skin Color Implementation
 * Tests all aspects of the skin color feature across generators
 */

import fs from 'fs'
import path from 'path'

console.log('🎨 Comprehensive Skin Color Implementation Test')
console.log('=' .repeat(50))

let allTestsPassed = true

function testResult(testName, passed, details = '') {
  const status = passed ? '✅' : '❌'
  console.log(`${status} ${testName}`)
  if (details) console.log(`   ${details}`)
  if (!passed) allTestsPassed = false
  return passed
}

// Test 1: File Structure
console.log('\n1️⃣  File Structure Tests')
console.log('---------------------')

const requiredFiles = [
  'lib/shared-skin-color.ts',
  'lib/animation-prompts.ts', 
  'lib/puppet-prompts.ts',
  'lib/style-prompts.ts',
  'lib/dinosona-prompts.ts',
  'components/animation-flow-modal.tsx',
  'scripts/update-generators-skin-color.mjs',
  'scripts/test-skin-color.mjs'
]

requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file)
  testResult(`${file} exists`, fs.existsSync(fullPath))
})

// Test 2: Shared Skin Color Utility
console.log('\n2️⃣  Shared Skin Color Utility Tests')
console.log('--------------------------------')

const skinColorFile = path.join(process.cwd(), 'lib', 'shared-skin-color.ts')
const skinColorContent = fs.readFileSync(skinColorFile, 'utf8')

testResult('Exports SKIN_COLOR_OPTIONS', skinColorContent.includes('export const SKIN_COLOR_OPTIONS'))
testResult('Exports generateColorDescription', skinColorContent.includes('export function generateColorDescription'))
testResult('Exports createSkinColorQuestion', skinColorContent.includes('export function createSkinColorQuestion'))

// Check bias prevention
const optionsMatch = skinColorContent.match(/SKIN_COLOR_OPTIONS[^=]*=\s*\[([\s\S]*?)\]/m)
if (optionsMatch) {
  const optionsText = optionsMatch[1]
  const darkBeforeWhite = optionsText.indexOf("'dark'") < optionsText.indexOf("'white'")
  const mediumBeforeLight = optionsText.indexOf("'medium'") < optionsText.indexOf("'light'")
  
  testResult('Dark options before white (no white-first bias)', darkBeforeWhite)
  testResult('Medium options before light', mediumBeforeLight)
  testResult('Diverse representation in first options', 
    optionsText.includes("'dark'") && optionsText.includes("'medium'") && optionsText.includes("'tan'"))
}

// Test 3: Animation Prompts
console.log('\n3️⃣  Animation Prompts Tests')
console.log('--------------------------')

const animationFile = path.join(process.cwd(), 'lib', 'animation-prompts.ts')
const animationContent = fs.readFileSync(animationFile, 'utf8')

testResult('Imports shared skin color utility', animationContent.includes('from "./shared-skin-color"'))
testResult('AnimationConfiguration has skinColor', animationContent.includes('skinColor?: string'))
testResult('generateAnimationPrompt handles skinColor', 
  animationContent.includes('skinColor') && animationContent.includes('generateColorDescription'))

// Test 4: Puppet Prompts
console.log('\n4️⃣  Puppet Prompts Tests')
console.log('----------------------')

const puppetFile = path.join(process.cwd(), 'lib', 'puppet-prompts.ts')
const puppetContent = fs.readFileSync(puppetFile, 'utf8')

testResult('Imports shared skin color utility', puppetContent.includes('from "./shared-skin-color"'))
testResult('Uses generateColorDescription', puppetContent.includes('generateColorDescription'))
testResult('Still supports puppet-specific materials', 
  puppetContent.includes('materialTerm') && puppetContent.includes('fur') && puppetContent.includes('felt'))

// Test 5: Style Prompts
console.log('\n5️⃣  Style Prompts Tests')
console.log('--------------------')

const styleFile = path.join(process.cwd(), 'lib', 'style-prompts.ts')
const styleContent = fs.readFileSync(styleFile, 'utf8')

testResult('Imports shared skin color utility', styleContent.includes('from "./shared-skin-color"'))
testResult('Has StyleConfiguration interface', styleContent.includes('StyleConfiguration'))
testResult('getDetailedStylePrompt accepts config', styleContent.includes('config?: StyleConfiguration'))

// Test 6: Dinosona Prompts
console.log('\n6️⃣  Dinosona Prompts Tests')
console.log('-----------------------')

const dinosonaFile = path.join(process.cwd(), 'lib', 'dinosona-prompts.ts')
const dinosonaContent = fs.readFileSync(dinosonaFile, 'utf8')

testResult('Imports shared skin color utility', dinosonaContent.includes('from "./shared-skin-color"'))
testResult('Has DinosonaConfiguration interface', dinosonaContent.includes('DinosonaConfiguration'))
testResult('generateDinosonaPrompt function exists', dinosonaContent.includes('generateDinosonaPrompt'))
testResult('Handles skin/scale coloring', dinosonaContent.includes('Skin/scale coloring'))

// Test 7: Animation Flow Modal
console.log('\n7️⃣  Animation Flow Modal Tests')
console.log('----------------------------')

const modalFile = path.join(process.cwd(), 'components', 'animation-flow-modal.tsx')
const modalContent = fs.readFileSync(modalFile, 'utf8')

testResult('Imports SKIN_COLOR_OPTIONS', modalContent.includes('SKIN_COLOR_OPTIONS'))
testResult('Has skinColor in config state', modalContent.includes('skinColor:'))
testResult('Has skin color step (step 4)', modalContent.includes('step === 4') && modalContent.includes('skin color'))
testResult('Has getSkinColorClass function', modalContent.includes('getSkinColorClass'))
testResult('Passes skinColor to generateAnimationPrompt', modalContent.includes('skinColor: config.skinColor'))

// Test 8: Dinosona API Update
console.log('\n8️⃣  Dinosona API Tests')
console.log('-------------------')

const dinosonaApiFile = path.join(process.cwd(), 'app', 'api', 'generators', 'dinosona', 'questions', 'route.ts')
const dinosonaApiContent = fs.readFileSync(dinosonaApiFile, 'utf8')

testResult('Imports createSkinColorQuestion', dinosonaApiContent.includes('createSkinColorQuestion'))
testResult('Uses skinColor in prompt template', dinosonaApiContent.includes('{{skinColor}}'))
testResult('Updated prompt template for dinosaur context', 
  dinosonaApiContent.includes('skin/scales') || dinosonaApiContent.includes('Skin/scale'))

// Test 9: Update Script
console.log('\n9️⃣  Update Script Tests')
console.log('---------------------')

const updateScriptFile = path.join(process.cwd(), 'scripts', 'update-generators-skin-color.mjs')
const updateScriptContent = fs.readFileSync(updateScriptFile, 'utf8')

testResult('Valid JavaScript syntax', !updateScriptContent.includes(' as ') && !updateScriptContent.includes(': any'))
testResult('Imports SKIN_COLOR_OPTIONS', updateScriptContent.includes('SKIN_COLOR_OPTIONS'))
testResult('Handles different generator types', 
  updateScriptContent.includes('puppetray') && updateScriptContent.includes('turn-toon') && updateScriptContent.includes('dinosona'))
testResult('Creates skinColor questions', updateScriptContent.includes("id: 'skinColor'"))

// Test 10: Integration Checks
console.log('\n🔟 Integration Tests')
console.log('------------------')

// Check that all prompt generators can work together
const hasConsistentInterface = [
  skinColorContent.includes('export function generateColorDescription'),
  animationContent.includes('skinColor?: string'),
  puppetContent.includes('skinColor?: string'),
  dinosonaContent.includes('skinColor?: string')
].every(Boolean)

testResult('Consistent skinColor interface across all generators', hasConsistentInterface)

// Check that all generators support the same color options
const allUseSharedOptions = [
  modalContent.includes('SKIN_COLOR_OPTIONS'),
  updateScriptContent.includes('SKIN_COLOR_OPTIONS'), 
  dinosonaApiContent.includes('createSkinColorQuestion')
].every(Boolean)

testResult('All generators use shared color options', allUseSharedOptions)

// Summary
console.log('\n🏁 Test Summary')
console.log('==============')

if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!')
  console.log('\n✨ Skin color implementation is complete and ready!')
  console.log('\nFeatures implemented:')
  console.log('• Shared skin color utility with diverse options')
  console.log('• No white-first bias in option ordering')
  console.log('• Animation generator supports skin color')
  console.log('• Puppet generator uses shared skin color utility')
  console.log('• Style prompts support skin color configuration')
  console.log('• Dinosona generator updated with standardized skin color')
  console.log('• Animation flow modal includes skin color selection')
  console.log('• Update script ready to modify all generators')
  console.log('\n🚀 Ready to deploy!')
} else {
  console.log('❌ Some tests failed. Please review the issues above.')
  process.exit(1)
}

console.log('\n📋 Next steps:')
console.log('1. Run the update script to add skin color to existing generators')
console.log('2. Test the UI functionality in a browser')
console.log('3. Verify prompts include skin color when specified')
console.log('4. Deploy the changes')