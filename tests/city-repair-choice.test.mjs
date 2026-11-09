import test from 'node:test';
import assert from 'node:assert/strict';
import { CityStoryLevels, CITY_STORY } from '../assets/scripts/CityStoryLevels.ts';
import { readSave, sameMilestone } from '../assets/scripts/SluiceWorld.ts';

function deliverBattery(level, destination) {
  level.beginMove(CITY_STORY.repair.battery + 50, true, true);
  level.moveProp(destination - CITY_STORY.repair.battery);
  level.endMove();
}

test('battery can power the service door while leaving the cleaner asleep', () => {
  const city = new CityStoryLevels();
  deliverBattery(city, CITY_STORY.repair.doorTarget);
  assert.equal(city.repairChoicePrompt(CITY_STORY.repair.doorTarget + 70, CITY_STORY.floor, true), 'gate');
  assert.equal(city.interact(CITY_STORY.repair.doorTarget + 70, true, CITY_STORY.floor), true);
  assert.equal(city.repairChoice, 'gate');
  assert.equal(city.repairSolved, true);
  assert.equal(city.save().battery, CITY_STORY.repair.doorTarget);
  assert.equal(city.save().repairChoice, 'gate');
});

test('battery can wake the cleaner, and either choice persists through restoration', () => {
  const city = new CityStoryLevels();
  deliverBattery(city, CITY_STORY.repair.target);
  assert.equal(city.repairChoicePrompt(CITY_STORY.repair.robot, CITY_STORY.floor, true), 'robot');
  assert.equal(city.interact(CITY_STORY.repair.robot, true, CITY_STORY.floor), true);
  const resumed = new CityStoryLevels();
  resumed.restore(city.save());
  assert.equal(resumed.repairChoice, 'robot');
  assert.equal(resumed.repairSolved, true);
});

test('legacy completed repair saves migrate to the service-door route', () => {
  const city = new CityStoryLevels();
  city.restore({ battery: 11120, rationBox: CITY_STORY.ration.target, pumpOn: false, waterBowl: CITY_STORY.cat.bowl });
  assert.equal(city.repairChoice, 'gate');
  assert.equal(city.repairSolved, true);

  const save = {
    version: 1, checkpoint: 'city-pump', opened: true,
    box: { position: 1, solved: true },
    cityStories: {
      ...city.save(), rationShadeDown: true, pumpOn: true,
    },
  };
  save.cityStories.battery = CITY_STORY.repair.doorTarget;
  assert.equal(readSave(JSON.stringify(save))?.cityStories?.repairChoice, 'gate');
});

test('choosing a route creates a distinct autosave milestone', () => {
  const city = new CityStoryLevels();
  city.battery = CITY_STORY.repair.doorTarget;
  const before = {
    ...city.save(), repairChoice: null,
  };
  const after = {
    ...city.save(), repairChoice: 'gate',
  };
  const progress = (cityStories) => ({
    version: 1, checkpoint: 'city-repair', opened: true, night: 1,
    escaped: true, alarm: true, policeCleared: true,
    box: { position: 1, solved: true }, cityStories,
  });
  assert.equal(sameMilestone(progress(before), progress(after)), false);
});
