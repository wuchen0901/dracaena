import test from 'node:test';
import assert from 'node:assert/strict';
import { CityStoryLevels, CITY_STORY } from '../assets/scripts/CityStoryLevels.ts';
import { readSave } from '../assets/scripts/SluiceWorld.ts';

test('ration box is only the step that lets 07 reach the shade cloth', () => {
  const city = new CityStoryLevels();
  city.beginMove(CITY_STORY.ration.box + 50, true, true);
  city.moveProp(CITY_STORY.ration.target - CITY_STORY.ration.box);
  city.endMove();

  assert.equal(city.rationBox, CITY_STORY.ration.target);
  assert.equal(city.rationSolved, false);
  assert.equal(city.walls().some(wall => wall.edge === CITY_STORY.ration.gate), true);
  assert.equal(city.canInteractRationShade(CITY_STORY.ration.target, CITY_STORY.floor + CITY_STORY.propH, true), true);
  assert.equal(city.canInteractRationShade(CITY_STORY.ration.target, CITY_STORY.floor, true), false);
  assert.equal(city.canInteractRationShade(CITY_STORY.ration.target, CITY_STORY.floor + CITY_STORY.propH, false), false);

  assert.equal(city.interact(CITY_STORY.ration.target, true, CITY_STORY.floor + CITY_STORY.propH), true);
  assert.equal(city.rationSolved, true);
  assert.equal(city.walls().some(wall => wall.edge === CITY_STORY.ration.gate), false);
  assert.equal(city.save().rationShadeDown, true);
});

test('ration shade state survives saves and malformed shade flags are rejected', () => {
  const city = new CityStoryLevels();
  city.restore({ rationBox: CITY_STORY.ration.target, rationShadeDown: true, battery: CITY_STORY.repair.battery, pumpOn: false, waterBowl: CITY_STORY.cat.bowl });
  assert.equal(city.rationSolved, true);
  const save = {
    version: 1, checkpoint: 'city-ration', opened: true,
    box: { position: 1, solved: true },
    cityStories: { ...city.save() },
  };
  assert.equal(readSave(JSON.stringify(save))?.cityStories?.rationShadeDown, true);
  save.cityStories.rationShadeDown = 'yes';
  assert.equal(readSave(JSON.stringify(save)), null);
});
