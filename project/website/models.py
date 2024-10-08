from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    age = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(120)], null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.username

class Availability(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.date} {self.start_time}-{self.end_time}"

class Appointment(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    availability = models.OneToOneField(Availability, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_paid = models.BooleanField(default=False)
    google_meet_link = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Appointment for {self.user.username} on {self.availability}"