/*
 * :copyright (c) 2014 - 2016, The Regents of the University of California, through Lawrence Berkeley National Laboratory (subject to receipt of any required approvals from the U.S. Department of Energy) and contributors. All rights reserved.
 * :author
 */

angular.module('BE.seed.controller.cycle_admin', [])
  .controller('cycle_admin_controller', [
    '$scope',
    '$log',
    'urls',
    'simple_modal_service',
    'Notification',
    'cycle_service',
    'cycles_payload',
    'organization_payload',
    'auth_payload',
    function ($scope, $log, urls, simple_modal_service, notification, cycle_service, cycles_payload, organization_payload, auth_payload) {

      $scope.org = organization_payload.organization;
      $scope.auth = auth_payload.auth;
      var processCycles = function (cycles) {
        $scope.cycles = _.map(cycles.cycles, function (cycle) {
          cycle.start = new Date(cycle.start);
          cycle.end = new Date(cycle.end);
          return cycle;
        });
      };
      processCycles(cycles_payload);

      function initialize_new_cycle() {
        $scope.new_cycle = {start: null, end: null, name: ''};
      }

      /*  Take user input from New Cycle form and submit
       to service to create a new cycle. */
      $scope.submitNewCycleForm = function (form) {
        if (form.$invalid) {
          return;
        }
        cycle_service.create_cycle($scope.new_cycle).then(function (result) {
            processCycles(result);
            var msg = 'Created new Cycle ' + getTruncatedName($scope.new_cycle.name);
            notification.primary(msg);
            initialize_new_cycle();
            form.$setPristine();
          }, function (message) {
            $log.error('Error creating new cycle.', message);
          }
        );
      };


      /* Checks for existing cycle name for inline edit form.
       Form assumes function will return a string if there's an existing cycle */
      $scope.checkEditCycleBeforeSave = function (newCycleName, currentCycleName) {
        if (newCycleName === currentCycleName) return;
        if (_.isEmpty(newCycleName)) return 'Enter at least one character';
        if (isCycleNameUsed(newCycleName)) return 'That Cycle name already exists';
      };

      function isCycleNameUsed(newCycleName) {
        return _.some($scope.cycles, function (obj) {
          return obj.name === newCycleName;
        });
      }

      /* Submit edit when 'enter' is pressed */
      $scope.onEditCycleNameKeypress = function (e, form) {
        if (e.which === 13) {
          form.$submit();
        }
      };


      $scope.saveCycle = function (cycle, id) {
        //Don't update $scope.cycle until a 'success' from server
        angular.extend(cycle, {id: id});
        cycle_service.update_cycle(cycle).then(
          function (data) {
            var msg = 'Cycle updated.';
            notification.primary(msg);
            processCycles(data);
          },
          function (message) {
            $log.error('Error saving cycle.', message);
          }
        );
      };

      $scope.opened = {};
      $scope.open = function ($event, elementOpened) {
        $event.preventDefault();
        $event.stopPropagation();

        if (elementOpened == 'end') $scope.opened.start = false;
        if (elementOpened == 'start') $scope.opened.end = false;
        $scope.opened[elementOpened] = !$scope.opened[elementOpened];
      };

      // Datepickers
      $scope.startDatePickerOpen = false;
      $scope.endDatePickerOpen = false;
      $scope.invalidDates = false; // set this to true when startDate >= endDate;


      // Handle datepicker open/close events
      $scope.openStartDatePicker = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.startDatePickerOpen = !$scope.startDatePickerOpen;
      };
      $scope.openEndDatePicker = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.endDatePickerOpen = !$scope.endDatePickerOpen;
      };

      $scope.$watch('startDate', function (newval, oldval) {
        $scope.checkInvalidDate();
      });

      $scope.$watch('endDate', function (newval, oldval) {
        $scope.checkInvalidDate();
      });

      $scope.checkInvalidDate = function () {
        $scope.invalidDates = ($scope.endDate < $scope.startDate);
      };

      //A delete operation has lots of consequences that are not completely defined. Not implementing at the moment.

      // $scope.deleteCycle = function (cycle, index) {
      //   var modalOptions = {
      //     type: 'default',
      //     okButtonText: 'OK',
      //     cancelButtonText: 'Cancel',
      //     headerText: 'Confirm delete',
      //     bodyText: 'Delete cycle "' + cycle.name + '"?'
      //   };
      //   simple_modal_service.showModal(modalOptions).then(
      //     function (result) {
      //       //user confirmed delete, so go ahead and do it.
      //       cycle_service.delete_cycle(cycle).then(
      //         function (result) {
      //           //server deleted cycle, so remove it locally
      //           $scope.cycles.splice(index, 1);
      //           var msg = 'Deleted cycle ' + getTruncatedName(cycle.name);
      //           notification.primary(msg);
      //         },
      //         function (message) {
      //           $log.error('Error deleting cycle.', message);
      //         }
      //       );
      //     },
      //     function (message) {
      //       //user doesn't want to delete after all.
      //     });
      //
      // };

      function getTruncatedName(name) {
        if (name && name.length > 20) {
          name = name.substr(0, 20) + '...';
        }
        return name;
      }

      initialize_new_cycle();

    }
  ]);