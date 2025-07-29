import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EduspaceGameComponentComponent } from './eduspace-game-component.component';

describe('EduspaceGameComponentComponent', () => {
  let component: EduspaceGameComponentComponent;
  let fixture: ComponentFixture<EduspaceGameComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EduspaceGameComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EduspaceGameComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
