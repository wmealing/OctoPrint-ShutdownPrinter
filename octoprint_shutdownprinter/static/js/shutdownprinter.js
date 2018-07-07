$(function() {
    function ShutdownPrinterViewModel(parameters) {
        var self = this;

        self.loginState = parameters[0];
        self.settings = parameters[1];
		
        self.shutdownprinterEnabled = ko.observable();
		
		self.eventChangeCheckToRadio =  function (id, listOff) {
				$(id).on("change", function () {
				if ($(this).prop("checked") == true)
				{
					listOff.forEach(function(element) {
						if (id != element.id)
						{
							if ($(element.id).prop("checked") == true)
							{
								$(element.id).unbind("change");
								$(element.id).trigger("click");
								self.eventChangeCheckToRadio(element.id, listOff);
							}
						}
					});
				}
			})
		}
		
		$("#tester_shutdownprinter_gcode").on("click", function () {
			self.settings.saveData();
			$(this).children("i").show();
			setTimeout(function (current) {
			$.ajax({
                url: API_BASEURL + "plugin/shutdownprinter",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "shutdown",
					mode: 1
                }),
                contentType: "application/json; charset=UTF-8"
            }).done(function() {
				current.children("i").hide();
			});
			
			}, 1000, $(this));
			 
		});		
		$("#tester_shutdownprinter_api").on("click", function () {
			self.settings.saveData();
			$(this).children("i").show();
			setTimeout(function (current) {
			$.ajax({
                url: API_BASEURL + "plugin/shutdownprinter",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "shutdown",
					mode: 2
                }),
                contentType: "application/json; charset=UTF-8"
            }).done(function() {
				current.children("i").hide();
			});
			}, 1000, $(this));
			
		});	
		
		$("#tester_shutdownprinter_api_custom").on("click", function () {
			self.settings.saveData();
			$(this).children("i").show();
			setTimeout(function (current) {
			$.ajax({
                url: API_BASEURL + "plugin/shutdownprinter",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "shutdown",
					mode: 3
                }),
                contentType: "application/json; charset=UTF-8"
            }).done(function() {
				current.children("i").hide();
			});
			}, 1000, $(this));
			
		});
		self.listOffMode = [
			{"id" : "#shutdownprinter_mode_shutdown_gcode"},
			{"id" : "#shutdownprinter_mode_shutdown_api"},
			{"id" : "#shutdownprinter_mode_shutdown_api_custom"},
		]
		self.listOffHTTPMethode = [
			{"id" : "#shutdownprinter_api_custom_GET"},
			{"id" : "#shutdownprinter_api_custom_POST"}
		]
		self.eventChangeCheckToRadio("#shutdownprinter_mode_shutdown_gcode", self.listOffMode);
		self.eventChangeCheckToRadio("#shutdownprinter_mode_shutdown_api", self.listOffMode);
		self.eventChangeCheckToRadio("#shutdownprinter_mode_shutdown_api_custom", self.listOffMode);
		
		self.eventChangeCheckToRadio("#shutdownprinter_api_custom_GET", self.listOffHTTPMethode);
		self.eventChangeCheckToRadio("#shutdownprinter_api_custom_POST", self.listOffHTTPMethode);
		
        // Hack to remove automatically added Cancel button
        // See https://github.com/sciactive/pnotify/issues/141
        PNotify.prototype.options.confirm.buttons = [];
        self.timeoutPopupText = gettext('Shutting down printer in ');
        self.timeoutPopupOptions = {
            title: gettext('Shutdown Printer'),
            type: 'notice',
            icon: true,
            hide: false,
            confirm: {
                confirm: true,
                buttons: [{
                    text: 'Abort Shutdown Printer',
                    addClass: 'btn-block btn-danger',
                    promptTrigger: true,
                    click: function(notice, value){
                        notice.remove();
                        notice.get().trigger("pnotify.cancel", [notice, value]);
                    }
                }]
            },
            buttons: {
                closer: false,
                sticker: false,
            },
            history: {
                history: false
            }
        };
        
        //for touch ui
		self.touchUIMoveElement = function (self, counter) {
			var hash = window.location.hash;
			if (hash != "" && hash != "#printer" && hash != "#touch")
			{
				return;
			}
			if (counter < 10) {
				if (document.getElementById("touch") != null && document.getElementById("printer") != null && document.getElementById("printer") != null && document.getElementById("touch").querySelector("#printer").querySelector("#files_wrapper")) {
					var newParent = document.getElementById("files_wrapper").parentNode;
					newParent.insertBefore(document.getElementById('sidebar_plugin_shutdownprinter_wrapper'), document.getElementById("files_wrapper"));
				} else {
					setTimeout(self.touchUIMoveElement, 1000, self, ++counter);
				}
			}
		}
		 //add octoprint event for check finish
		self.onStartupComplete = function () {
			self.touchUIMoveElement(self, 0);
		};
        
		self.onEventPrinterStateChanged = function(payload) {
        			if (payload.state_id == "PRINTING" || payload.state_id == "PAUSED"){
        				$("#tester_shutdownprinter_gcode").prop("disabled", true);
        				$("#tester_shutdownprinter_api").prop("disabled", true);
        				$("#tester_shutdownprinter_api_custom").prop("disabled", true);
        			} else {
        				$("#tester_shutdownprinter_gcode").prop("disabled", false);
        				$("#tester_shutdownprinter_api").prop("disabled", false);
        				$("#tester_shutdownprinter_api_custom").prop("disabled", false);
        			}
        		}
		
        self.onShutdownPrinterEvent = function() {
            if (self.shutdownprinterEnabled()) {
                $.ajax({
                    url: API_BASEURL + "plugin/shutdownprinter",
                    type: "POST",
                    dataType: "json",
                    data: JSON.stringify({
                        command: "enable"
                    }),
                    contentType: "application/json; charset=UTF-8"
                })
            } else {
                $.ajax({
                    url: API_BASEURL + "plugin/shutdownprinter",
                    type: "POST",
                    dataType: "json",
                    data: JSON.stringify({
                        command: "disable"
                    }),
                    contentType: "application/json; charset=UTF-8"
                })
            }
        }

        self.shutdownprinterEnabled.subscribe(self.onShutdownPrinterEvent, self);

        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin != "shutdownprinter") {
                return;
            }

            self.shutdownprinterEnabled(data.shutdownprinterEnabled);

            if (data.type == "timeout") {
                if ((data.timeout_value != null) && (data.timeout_value > 0)) {
                    self.timeoutPopupOptions.text = self.timeoutPopupText + data.timeout_value;
                    if (typeof self.timeoutPopup != "undefined") {
                        self.timeoutPopup.update(self.timeoutPopupOptions);
                    } else {
                        self.timeoutPopup = new PNotify(self.timeoutPopupOptions);
                        self.timeoutPopup.get().on('pnotify.cancel', function() {self.abortShutdown(true);});
                    }
                } else {
                    if (typeof self.timeoutPopup != "undefined") {
                        self.timeoutPopup.remove();
                        self.timeoutPopup = undefined;
                    }
                }
            }
        }

        self.abortShutdown = function(abortShutdownValue) {
            self.timeoutPopup.remove();
            self.timeoutPopup = undefined;
            $.ajax({
                url: API_BASEURL + "plugin/shutdownprinter",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "abort"
                }),
                contentType: "application/json; charset=UTF-8"
            })
        }
    }

    OCTOPRINT_VIEWMODELS.push([
        ShutdownPrinterViewModel,
        ["loginStateViewModel", "settingsViewModel"],
        document.getElementById("sidebar_plugin_shutdownprinter")
    ]);
});
