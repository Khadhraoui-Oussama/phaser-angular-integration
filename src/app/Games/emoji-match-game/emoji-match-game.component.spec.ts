import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiMatchGameComponent } from './emoji-match-game.component';

describe('EmojiMatchGameComponent', () => {
  let component: EmojiMatchGameComponent;
  let fixture: ComponentFixture<EmojiMatchGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiMatchGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmojiMatchGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
