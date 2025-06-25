import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnowmenAttackGameComponent } from './snowmen-attack-game.component';

describe('SnowmenAttackGameComponent', () => {
  let component: SnowmenAttackGameComponent;
  let fixture: ComponentFixture<SnowmenAttackGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnowmenAttackGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnowmenAttackGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
